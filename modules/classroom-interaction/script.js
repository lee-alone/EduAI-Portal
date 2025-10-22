document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // Auto-populate current date
    const dateDisplay = document.getElementById('date-display');
    if (dateDisplay) {
        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = today.toLocaleDateString('zh-CN', options);
    }

    // Placeholder for export data button
    const exportDataBtn = document.getElementById('export-data-btn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            alert('导出数据功能待实现！');
            // TODO: Implement Excel export with subject, topic, date, and activity data
        });
    }

    // Placeholder for AI report generation button
    const generateAiReportBtn = document.getElementById('generate-ai-report-btn');
    if (generateAiReportBtn) {
        generateAiReportBtn.addEventListener('click', () => {
            alert('AI学情报告生成功能待实现！');
            // TODO: Implement AI report generation
        });
    }

    // --- Excel Parsing Logic ---
    let activityData = []; // Stores parsed activity data
    let studentRoster = {}; // Stores parsed student roster (seat_no -> name)

    const activityExcelUpload = document.getElementById('activity-excel-upload');
    const rosterExcelUpload = document.getElementById('roster-excel-upload');

    if (activityExcelUpload) {
        activityExcelUpload.addEventListener('change', (event) => {
            handleFileUpload(event.target.files[0], 'activity');
        });
    }

    if (rosterExcelUpload) {
        rosterExcelUpload.addEventListener('change', (event) => {
            handleFileUpload(event.target.files[0], 'roster');
        });
    }

    function handleFileUpload(file, type) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            if (type === 'activity') {
                activityData = json;
                console.log('课堂活动数据:', activityData);
                showMessage('课堂活动Excel上传成功！', 'success');
            } else if (type === 'roster') {
                studentRoster = parseRoster(json);
                console.log('学生名单数据:', studentRoster);
                showMessage('学生名单Excel上传成功！', 'success');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function parseRoster(json) {
        const roster = {};
        // Assuming roster Excel has columns like '座号' and '姓名'
        json.forEach(row => {
            if (row['座号'] && row['姓名']) {
                roster[row['座号']] = row['姓名'];
            }
        });
        return roster;
    }

    // ==================== Utility Functions ====================
    function showMessage(message, type = "info", duration = 4000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-alert ${type}`;
        messageDiv.innerHTML = message;
        document.body.appendChild(messageDiv);
        setTimeout(() => {
            messageDiv.remove();
        }, duration);
    }

    // --- Classroom Interaction Logic ---
    const TOTAL_STUDENTS = 55; // 假设班级总人数
    let students = []; // { id: 1, name: '学生1' }
    let studentPoints = {}; // { 1: 0, 2: 10, ... }
    let calledStudents = []; // [1, 5, 10]
    let pointsLog = []; // [{ studentId: 1, reason: '回答正确', points: 0.5, timestamp: '...' }]

    const getStudentName = (id) => studentRoster[id] || `学生${id}`;

    // DOM Elements for Live Interaction
    const singleCallResult = document.getElementById('single-call-result');
    const multiCallResult = document.getElementById('multi-call-result');
    const calledStudentsList = document.getElementById('called-students-list');
    const groupStudentSelection = document.getElementById('group-student-selection');
    const topStudentsList = document.getElementById('top-students-list');
    const recentPointsLog = document.getElementById('recent-points-log');

    function initializeClassroom() {
        console.log('initializeClassroom: 开始初始化课堂...');
        // Initialize students array
        for (let i = 1; i <= TOTAL_STUDENTS; i++) {
            students.push({ id: i, name: getStudentName(i) });
            studentPoints[i] = 0;
        }
        // Load state from localStorage if available
        loadState();
        // Initial render
        console.log('initializeClassroom: 渲染小组学生选择...');
        renderGroupStudentSelection();
        console.log('initializeClassroom: 渲染已点名学生...');
        renderCalledStudents();
        console.log('initializeClassroom: 渲染今日之星...');
        renderTopStudents();
        console.log('initializeClassroom: 渲染最近加分记录...');
        renderPointsLog();
        console.log('initializeClassroom: 课堂初始化完成。');
    }

    function saveState() {
        localStorage.setItem('classroomState', JSON.stringify({
            studentPoints,
            calledStudents,
            pointsLog
        }));
    }

    function loadState() {
        const savedState = localStorage.getItem('classroomState');
        if (savedState) {
            const state = JSON.parse(savedState);
            studentPoints = state.studentPoints;
            calledStudents = state.calledStudents;
            pointsLog = state.pointsLog;
        }
    }

    function renderGroupStudentSelection() {
        if (!groupStudentSelection) return;
        groupStudentSelection.innerHTML = students.map(s => `
            <label for="group-student-${s.id}" class="inline-flex items-center">
                <input type="checkbox" id="group-student-${s.id}" name="group-student-selection" class="form-checkbox text-blue-600" value="${s.id}">
                <span class="ml-2 text-gray-700">${s.id}号 ${s.name}</span>
            </label>
        `).join('');
    }

    function renderCalledStudents() {
        if (!calledStudentsList) return;
        if (calledStudents.length === 0) {
            calledStudentsList.innerHTML = '<li class="text-gray-500">暂无点名记录</li>';
            return;
        }
        calledStudentsList.innerHTML = calledStudents.map(id => `
            <li class="text-gray-700">${id}号 ${getStudentName(id)}</li>
        `).join('');
    }

    function renderTopStudents() {
        if (!topStudentsList) return;
        const sortedStudents = Object.entries(studentPoints)
            .map(([id, points]) => ({ id: parseInt(id), name: getStudentName(parseInt(id)), points }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 5); // Display top 5

        if (sortedStudents.length === 0 || sortedStudents[0].points === 0) {
            topStudentsList.innerHTML = '<li class="text-gray-500">暂无积分记录</li>';
            return;
        }

        topStudentsList.innerHTML = sortedStudents.map((s, index) => `
            <li class="flex items-center py-2 px-3 my-1 bg-white rounded-lg shadow-sm">
                <span class="font-bold text-lg mr-2 ${index === 0 ? 'text-yellow-500' : 'text-gray-500'}">${index + 1}.</span>
                <span class="flex-grow text-gray-800">${s.name} (${s.id}号)</span>
                <span class="font-semibold text-blue-600">${s.points}分</span>
            </li>
        `).join('');
    }

    function renderPointsLog() {
        if (!recentPointsLog) return;
        if (pointsLog.length === 0) {
            recentPointsLog.innerHTML = '<li class="text-gray-500">暂无加分记录</li>';
            return;
        }
        // Display last 10 entries
        const displayLog = pointsLog.slice(-10).reverse(); 
        recentPointsLog.innerHTML = displayLog.map(log => `
            <li class="py-1 border-b last:border-b-0 text-sm text-gray-700">
                <span class="font-medium">${log.timestamp}</span> - ${log.studentId}号 ${getStudentName(log.studentId)}: ${log.reason} (+${log.points}分)
            </li>
        `).join('');
    }

    // Initialize classroom on load
    initializeClassroom();

    // --- Roll Call System Logic ---
    const randomCallBtn = document.getElementById('random-call-btn');
    const multiCallBtn = document.getElementById('multi-call-btn');
    const multiCallNumInput = document.getElementById('multi-call-num');
    const resetCallBtn = document.getElementById('reset-call-btn');

    if (randomCallBtn) {
        randomCallBtn.addEventListener('click', () => {
            const uncalledStudents = students.filter(s => !calledStudents.includes(s.id));
            if (uncalledStudents.length === 0) {
                singleCallResult.textContent = '所有学生都已被点名！';
                return;
            }
            const randomIndex = Math.floor(Math.random() * uncalledStudents.length);
            const selectedStudent = uncalledStudents[randomIndex];

            calledStudents.push(selectedStudent.id);
            singleCallResult.textContent = `${selectedStudent.name} (${selectedStudent.id}号) 被点到！`;
            renderCalledStudents();
            saveState();
        });
    }

    if (multiCallBtn) {
        multiCallBtn.addEventListener('click', () => {
            const numToCall = parseInt(multiCallNumInput.value);
            if (isNaN(numToCall) || numToCall <= 0) {
                multiCallResult.textContent = '请输入有效的点名人数！';
                return;
            }

            let uncalledStudents = students.filter(s => !calledStudents.includes(s.id));
            if (uncalledStudents.length === 0) {
                multiCallResult.textContent = '所有学生都已被点名！';
                return;
            }
            if (numToCall > uncalledStudents.length) {
                multiCallResult.textContent = `剩余未点名学生不足${numToCall}人，仅点名${uncalledStudents.length}人。`;
                numToCall = uncalledStudents.length;
            }

            const selectedStudents = [];
            for (let i = 0; i < numToCall; i++) {
                const randomIndex = Math.floor(Math.random() * uncalledStudents.length);
                selectedStudents.push(uncalledStudents[randomIndex]);
                calledStudents.push(uncalledStudents[randomIndex].id);
                uncalledStudents.splice(randomIndex, 1); // Remove to avoid re-selection
            }

            multiCallResult.textContent = selectedStudents.map(s => `${s.name} (${s.id}号)`).join(', ') + ' 被点到！';
            renderCalledStudents();
            saveState();
        });
    }

    if (resetCallBtn) {
        resetCallBtn.addEventListener('click', () => {
            calledStudents = [];
            singleCallResult.textContent = '点名结果将显示在这里';
            multiCallResult.textContent = '点名结果将显示在这里';
            renderCalledStudents();
            saveState();
            showMessage('点名记录已重置！', 'info');
        });
    }

    // --- Points System Logic ---
    const addIndividualPointsBtn = document.getElementById('add-individual-points-btn');
    const individualStudentIdInput = document.getElementById('individual-student-id');
    const individualPointsInput = document.getElementById('individual-points');
    const individualReasonInput = document.getElementById('individual-reason');

    const addGroupPointsBtn = document.getElementById('add-group-points-btn');
    const groupPointsInput = document.getElementById('group-points');
    const groupReasonInput = document.getElementById('group-reason');

    if (addIndividualPointsBtn) {
        addIndividualPointsBtn.addEventListener('click', () => {
            const studentId = parseInt(individualStudentIdInput.value);
            const points = parseFloat(individualPointsInput.value);
            const reason = individualReasonInput.value.trim();

            if (isNaN(studentId) || studentId <= 0 || studentId > TOTAL_STUDENTS) {
                alert('请输入有效的学生座号！');
                return;
            }
            if (isNaN(points) || points <= 0) {
                alert('请输入有效的加分值！');
                return;
            }
            if (!reason) {
                alert('请输入加分原因！');
                return;
            }

            studentPoints[studentId] = (studentPoints[studentId] || 0) + points;
            pointsLog.push({
                studentId: studentId,
                reason: reason,
                points: points,
                timestamp: new Date().toLocaleString()
            });

            renderTopStudents();
            renderPointsLog();
            saveState();
            showMessage(`${getStudentName(studentId)} (${studentId}号) 已加 ${points} 分！`, 'success');

            // Clear inputs
            individualStudentIdInput.value = '';
            individualPointsInput.value = '0.5';
            individualReasonInput.value = '';
        });
    }

    if (addGroupPointsBtn) {
        addGroupPointsBtn.addEventListener('click', () => {
            const selectedCheckboxes = document.querySelectorAll('#group-student-selection input[type="checkbox"]:checked');
            const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
            const points = parseFloat(groupPointsInput.value);
            const reason = groupReasonInput.value.trim();

            if (selectedStudentIds.length === 0) {
                showMessage('请选择至少一名学生！', 'warning');
                return;
            }
            if (isNaN(points) || points <= 0) {
                showMessage('请输入有效的加分值！', 'warning');
                return;
            }
            if (!reason) {
                showMessage('请输入加分原因！', 'warning');
                return;
            }

            selectedStudentIds.forEach(studentId => {
                studentPoints[studentId] = (studentPoints[studentId] || 0) + points;
                pointsLog.push({
                    studentId: studentId,
                    reason: reason,
                    points: points,
                    timestamp: new Date().toLocaleString()
                });
            });

            renderTopStudents();
            renderPointsLog();
            saveState();
            showMessage(`已为 ${selectedStudentIds.length} 名学生加 ${points} 分！`, 'success');

            // Clear inputs and uncheck checkboxes
            selectedCheckboxes.forEach(cb => cb.checked = false);
            groupPointsInput.value = '0.5';
            groupReasonInput.value = '';
        });
    }

    // --- Data Export Logic ---
    const subjectInput = document.getElementById('subject-input');
    const topicInput = document.getElementById('topic-input');
    // dateDisplay is already declared globally

    if (exportDataBtn) {
        console.log('Found exportDataBtn, attaching listener.');
        exportDataBtn.addEventListener('click', () => {
            const subject = subjectInput.value.trim();
            const topic = topicInput.value.trim();
            const date = dateDisplay.textContent.trim();

            if (!subject || !topic) {
                showMessage('请输入学科和课题，以便导出完整数据！', 'warning');
                return;
            }

            // Prepare Classroom Activity Data
            const classroomActivityData = [
                ['学科', subject],
                ['课题', topic],
                ['日期', date],
                [], // Empty row for separation
                ['座号', '姓名', '总积分', '是否被点名']
            ];
            students.forEach(s => {
                classroomActivityData.push([
                    s.id,
                    getStudentName(s.id),
                    studentPoints[s.id] || 0,
                    calledStudents.includes(s.id) ? '是' : '否'
                ]);
            });

            // Prepare Points Log Data
            const pointsLogData = [
                ['座号', '姓名', '加分值', '加分原因', '时间']
            ];
            pointsLog.forEach(log => {
                pointsLogData.push([
                    log.studentId,
                    getStudentName(log.studentId),
                    log.points,
                    log.reason,
                    log.timestamp
                ]);
            });

            // Create a new workbook
            const wb = XLSX.utils.book_new();

            // Add Classroom Activity Data sheet
            const ws1 = XLSX.utils.aoa_to_sheet(classroomActivityData);
            XLSX.utils.book_append_sheet(wb, ws1, '课堂活动数据');

            // Add Points Log Data sheet
            const ws2 = XLSX.utils.aoa_to_sheet(pointsLogData);
            XLSX.utils.book_append_sheet(wb, ws2, '加分记录');

            // Generate and download Excel file
            const filename = `${date}_${subject}_${topic}_课堂数据.xlsx`;
            XLSX.writeFile(wb, filename);

            showMessage('课堂数据已成功导出为Excel！', 'success');
        });
    } else {
        console.log('exportDataBtn not found.');
    }

    // ==================== AI Analytics Logic ====================
    const aiModelInput = document.getElementById('ai-model-input');
    const customPromptTextarea = document.getElementById('custom-prompt-textarea');
    // generateAiReportBtn is already declared globally
    const aiReportOutput = document.getElementById('ai-report-output');

    // Function to get API key (copied from js/config.js for direct use)
    function getSharedApiKey() {
        const keyParts = ["sk-0560c9a8", "49694436a71c", "1ef4c053505a"];
        return keyParts.join('');
    }

    // Placeholder for API_CONFIG (will be more detailed later)
    const API_CONFIG = {
        deepseek: { url: "https://api.deepseek.com/v1/chat/completions", models: ["deepseek-chat", "deepseek-reasoner"] },
        glm: { url: "https://open.bigmodel.cn/api/paas/v4/chat/completions", models: ["glm-4"] },
        qwen: { url: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", models: ["qwen-turbo"] }
    };

    function getApiConfig(model) {
        return Object.values(API_CONFIG).find(config => config.models.includes(model)) || API_CONFIG.deepseek;
    }

    async function safeApiCall(apiUrl, apiKey, payload) {
        try {
            const response = await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, body: JSON.stringify(payload) });
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${await response.text()}`);
            }
            return await response.json();
        } catch (error) {
            console.error("API call failed:", error);
            throw new Error(`Network or API call failed: ${error.message}`);
        }
    }

    function mergeActivityAndRoster(activityData, studentRoster) {
        const studentReports = {};

        // Initialize reports for all students in the roster
        for (const seatNo in studentRoster) {
            studentReports[seatNo] = {
                seatNo: parseInt(seatNo),
                name: studentRoster[seatNo],
                totalPoints: 0,
                calledCount: 0,
                pointsBreakdown: []
            };
        }

        // Process activity data
        activityData.forEach(row => {
            const seatNo = row['座号']; // Assuming '座号' column in activity Excel
            if (studentReports[seatNo]) {
                studentReports[seatNo].totalPoints = row['总积分'] || 0; // Assuming '总积分' column
                studentReports[seatNo].calledCount = (row['是否被点名'] === '是' ? 1 : 0); // Assuming '是否被点名'
                // For detailed points breakdown, we'd need the points log from the activity Excel
                // For now, we'll just use total points and called status
            }
        });

        // Convert to array and sort by seat number
        return Object.values(studentReports).sort((a, b) => a.seatNo - b.seatNo);
    }

    async function generateAiReport() {
        if (activityData.length === 0) {
            showMessage('请先上传课堂活动Excel！', 'warning');
            return;
        }
        if (Object.keys(studentRoster).length === 0) {
            showMessage('请先上传学生名单Excel！', 'warning');
            return;
        }

        aiReportOutput.innerHTML = '<p class="text-gray-700"><i class="fas fa-spinner fa-spin mr-2"></i>AI正在生成学情报告，请稍候...</p>';
        generateAiReportBtn.disabled = true;

        try {
            const mergedData = mergeActivityAndRoster(activityData, studentRoster);
            const aiModel = aiModelInput.value.trim();
            const customPrompt = customPromptTextarea.value.trim();

            const subject = document.getElementById('subject-input').value.trim();
            const topic = document.getElementById('topic-input').value.trim();
            const date = document.getElementById('date-display').textContent.trim();

            let prompt = `你是一位资深班主任，请根据以下课堂活动数据，为班级生成一份详细的学情报告。报告应包含对整体表现的总结，对表现突出学生的表扬，以及对需要改进学生的建议。请结合学科、课题和日期信息，使报告更具针对性。`;

            if (subject) prompt += `\n学科: ${subject}`;
            if (topic) prompt += `\n课题: ${topic}`;
            if (date) prompt += `\n日期: ${date}`;
            prompt += `\n\n课堂活动数据:\n`;

            mergedData.forEach(student => {
                prompt += `- ${student.name} (${student.seatNo}号): 总积分 ${student.totalPoints} 分, 被点名 ${student.calledCount} 次.\n`;
            });

            if (customPrompt) {
                prompt += `\n\n用户自定义要求: ${customPrompt}`;
            }

            const apiConfig = getApiConfig(aiModel);
            const apiKey = getSharedApiKey(); // Using shared key for now, can add user API key input later

            const payload = {
                model: aiModel,
                messages: [
                    { role: "system", content: "你是一位经验丰富的教育专家，擅长根据学生数据生成学情报告。" },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7 // Can be made configurable
            };

            const data = await safeApiCall(apiConfig.url, apiKey, payload);
            const aiResponse = data.choices?.[0]?.message?.content?.trim() || data.result || data.output?.[0]?.content || '未能生成报告。';

            aiReportOutput.innerHTML = `<p class="text-gray-700 whitespace-pre-wrap">${aiResponse}</p>`;
            showMessage('AI学情报告生成成功！', 'success');

        } catch (error) {
            console.error('生成AI报告失败:', error);
            aiReportOutput.innerHTML = `<p class="text-red-500">生成AI报告失败: ${error.message}</p>`;
            showMessage(`生成AI报告失败: ${error.message}`, 'error');
        } finally {
            generateAiReportBtn.disabled = false;
        }
    }

    if (generateAiReportBtn) {
        console.log('Found generateAiReportBtn, attaching listener.');
        generateAiReportBtn.addEventListener('click', generateAiReport);
    } else {
        console.log('generateAiReportBtn not found.');
    }
});