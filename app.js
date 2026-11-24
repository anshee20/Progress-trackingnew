
const STORAGE_KEY = "studentProgressData";

let data = {
    students: [],
    marks: [],
    attendance: []
};

// Load saved data safely
try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    data.students = Array.isArray(saved.students) ? saved.students : [];
    data.marks = Array.isArray(saved.marks) ? saved.marks : [];
    data.attendance = Array.isArray(saved.attendance) ? saved.attendance : [];
} catch (error) {
    console.error("Could not load AcadTrack data:", error);
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    renderAll();
}

function createId() {
    return Date.now().toString() + Math.random().toString(36).slice(2, 7);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function percentage(mark) {
    return mark.total > 0 ? (mark.obtained / mark.total) * 100 : 0;
}

function resultStatus(mark) {
    return percentage(mark) >= 40 ? "Pass" : "Fail";
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

/* =====================================
   STUDENT MANAGEMENT
===================================== */

function addStudent(student) {
    student.name = String(student.name || "").trim();
    student.enrollment = String(student.enrollment || "").trim();

    if (!student.name || !student.enrollment) {
        alert("Please enter student name and enrollment number.");
        return false;
    }

    const duplicate = data.students.some(s =>
        String(s.enrollment).toLowerCase() ===
        student.enrollment.toLowerCase()
    );

    if (duplicate) {
        alert("Enrollment number already exists!");
        return false;
    }

    data.students.push({
        id: createId(),
        ...student,
        createdAt: new Date().toLocaleDateString()
    });

    saveData();
    alert("Student registered successfully!");
    return true;
}

function editStudent(id, updatedDetails) {
    const student = data.students.find(s => s.id === id);
    if (!student) return;

    Object.assign(student, updatedDetails);
    saveData();
}

function deleteStudent(id) {
    if (!confirm("Delete this student and all their records?")) return;

    data.students = data.students.filter(s => s.id !== id);
    data.marks = data.marks.filter(m => m.studentId !== id);
    data.attendance = data.attendance.filter(a => a.studentId !== id);

    saveData();
}

function displayStudents(search = "") {
    const table = document.getElementById("studentsTable");
    if (!table) return;

    const filtered = data.students.filter(s =>
        [s.name, s.enrollment, s.course, s.className, s.email]
            .some(value =>
                String(value || "").toLowerCase().includes(search.toLowerCase())
            )
    );

    if (!filtered.length) {
        table.innerHTML = `
            <tr><td colspan="5">No registered students found.</td></tr>
        `;
        return;
    }

    table.innerHTML = filtered.map(s => `
        <tr>
            <td>${escapeHTML(s.name)}</td>
            <td>${escapeHTML(s.enrollment)}</td>
            <td>${escapeHTML(s.className || s.course || "-")}</td>
            <td>${escapeHTML(s.email || "-")}</td>
            <td>${escapeHTML(s.admissionDate || s.createdAt || "-")}</td>
        </tr>
    `).join("");
}

/* =====================================
   DROPDOWNS
===================================== */

function populateStudentDropdown() {
    // Support both IDs used in your existing pages
    ["marksStudent", "markStudent"].forEach(id => {
        const dropdown = document.getElementById(id);
        if (!dropdown) return;

        const previousValue = dropdown.value;

        dropdown.innerHTML = `
            <option value="">Select a student</option>
            ${data.students.map(s => `
                <option value="${escapeHTML(s.id)}">
                    ${escapeHTML(s.name)} (${escapeHTML(s.enrollment)})
                </option>
            `).join("")}
        `;

        if (data.students.some(s => s.id === previousValue)) {
            dropdown.value = previousValue;
        }
    });
}

function populateAttendanceDropdown() {
    const dropdown = document.getElementById("attendanceStudent");
    if (!dropdown) return;

    const previousValue = dropdown.value;

    dropdown.innerHTML = `
        <option value="">Select a student</option>
        ${data.students.map(s => `
            <option value="${escapeHTML(s.id)}">
                ${escapeHTML(s.name)} (${escapeHTML(s.enrollment)})
            </option>
        `).join("")}
    `;

    if (data.students.some(s => s.id === previousValue)) {
        dropdown.value = previousValue;
    }
}

/* =====================================
   MARKS AND RESULTS
===================================== */

function addMarks(studentId, subject, exam, obtained, total) {
    obtained = Number(obtained);
    total = Number(total);

    if (!studentId || !subject || !exam ||
        !Number.isFinite(obtained) ||
        !Number.isFinite(total) ||
        total <= 0 || obtained < 0 || obtained > total) {
        alert("Please enter valid marks and student details.");
        return false;
    }

    if (!data.students.some(s => s.id === studentId)) {
        alert("Please select a valid student.");
        return false;
    }

    data.marks.push({
        id: createId(),
        studentId,
        subject,
        exam,
        obtained,
        total,
        date: new Date().toLocaleDateString()
    });

    saveData();
    return true;
}

function editMarks(id, obtained, total) {
    const mark = data.marks.find(m => m.id === id);

    obtained = Number(obtained);
    total = Number(total);

    if (!mark || !Number.isFinite(obtained) ||
        !Number.isFinite(total) || total <= 0 ||
        obtained < 0 || obtained > total) {
        alert("Enter valid marks.");
        return;
    }

    mark.obtained = obtained;
    mark.total = total;
    saveData();
}

function deleteMarks(id) {
    if (!confirm("Delete this marks record?")) return;

    data.marks = data.marks.filter(m => m.id !== id);
    saveData();
}

function displayMarks() {
    const table = document.getElementById("marksTableBody");
    if (!table) return;

    if (!data.marks.length) {
        table.innerHTML = `
            <tr><td colspan="7">No marks records available.</td></tr>
        `;
        return;
    }

    table.innerHTML = data.marks.map(m => {
        const student = data.students.find(s => s.id === m.studentId);

        return `
            <tr>
                <td>${escapeHTML(student?.name || "Unknown")}</td>
                <td>${escapeHTML(student?.enrollment || "-")}</td>
                <td>${escapeHTML(m.exam)}</td>
                <td>${escapeHTML(m.subject)}</td>
                <td>${m.obtained}/${m.total}</td>
                <td>${percentage(m).toFixed(1)}%</td>
                <td>${resultStatus(m)}</td>
            </tr>
        `;
    }).join("");
}

/* =====================================
   DASHBOARD
===================================== */


/* =====================================
   DASHBOARD
===================================== */

function displayDashboard() {
    const students = data.students || [];
    const marks = data.marks || [];

    // Total students
    setText("totalStudents", students.length);

    // Total marks records
    setText("totalMarks", marks.length);

    // Average marks
    const average = marks.length
        ? marks.reduce((sum, mark) => sum + percentage(mark), 0) / marks.length
        : 0;

    setText("averageMarks", average.toFixed(1) + "%");

    // Pass percentage
    const passed = marks.filter(mark => resultStatus(mark) === "Pass").length;

    const passRate = marks.length
        ? (passed / marks.length) * 100
        : 0;

    setText("passPercentage", passRate.toFixed(1) + "%");

    // Recent students — your homepage uses a TABLE, so render table rows
    const recent = document.getElementById("recentStudents");

    if (recent) {
        if (students.length === 0) {
            recent.innerHTML = `
                <tr>
                    <td colspan="4">No student records available.</td>
                </tr>
            `;
        } else {
            recent.innerHTML = [...students]
                .slice(-5)
                .reverse()
                .map(student => {
                    const records = marks.filter(
                        mark => mark.studentId === student.id
                    );

                    const studentAverage = records.length
                        ? records.reduce(
                            (sum, mark) => sum + percentage(mark), 0
                        ) / records.length
                        : 0;

                    return `
                        <tr>
                            <td>${escapeHTML(student.name)}</td>
                            <td>${escapeHTML(student.enrollment)}</td>
                            <td>${escapeHTML(student.course || student.className || "-")}</td>
                            <td>${records.length ? studentAverage.toFixed(1) + "%" : "-"}</td>
                        </tr>
                    `;
                }).join("");
        }
    }

    // Subject performance chart
    displaySubjectChart();
}


   


    // Get saved data
    const students = data.students || [];
    const marks = data.marks || [];

    // Total students
    setText("totalStudents", students.length);

    // Calculate average marks
    let average = 0;

    if (marks.length > 0) {
        const totalPercentage = marks.reduce(
            (sum, mark) => sum + percentage(mark), 0
        );

        average = totalPercentage / marks.length;
    }

    setText("averageMarks", average.toFixed(1) + "%");

    // Calculate pass percentage
    const passed = marks.filter(
        mark => percentage(mark) >= 40
    ).length;

    const passRate = marks.length
        ? (passed / marks.length) * 100
        : 0;

    setText("passPercentage", passRate.toFixed(1) + "%");

    // Display recent students
    const recent = document.getElementById("recentStudents");

    if (recent) {

        if (students.length === 0) {
            recent.innerHTML = "<li>No student records available.</li>";
        } else {
            recent.innerHTML = [...students]
                .reverse()
                .slice(0, 5)
                .map(student => `
                    <li>
                        <strong>${escapeHTML(student.name)}</strong>
                        - ${escapeHTML(student.enrollment)}
                    </li>
                `)
                .join("");
        }
    }

    // Display subject performance
    displaySubjectChart();

    


/* =====================================
   ANALYTICS
===================================== */

function getStudentAverages() {
    return data.students.map(student => {
        const records = data.marks.filter(m => m.studentId === student.id);

        const average = records.length
            ? records.reduce((sum, m) => sum + percentage(m), 0) / records.length
            : 0;

        return { ...student, average, records: records.length };
    });
}

function displayLeaderboard() {
    const element = document.getElementById("leaderboard");
    if (!element) return;

    element.innerHTML = getStudentAverages()
        .filter(s => s.records > 0)
        .sort((a, b) => b.average - a.average)
        .map((s, i) => `
            <li>${i + 1}. ${escapeHTML(s.name)} - ${s.average.toFixed(1)}%</li>
        `).join("");
}

function displaySubjectAverages() {
    const element = document.getElementById("subjectAverages");
    if (!element) return;

    const subjects = {};

    data.marks.forEach(m => {
        subjects[m.subject] ??= [];
        subjects[m.subject].push(percentage(m));
    });

    element.innerHTML = Object.entries(subjects).map(([subject, marks]) => {
        const average = marks.reduce((a, b) => a + b, 0) / marks.length;
        return `<li>${escapeHTML(subject)}: ${average.toFixed(1)}%</li>`;
    }).join("");
}

function displayPerformanceGroups() {
    const ranking = getStudentAverages();

    const excellent = document.getElementById("excellentPerformers");
    const support = document.getElementById("needsSupport");

    if (excellent) {
        excellent.innerHTML = ranking
            .filter(s => s.records && s.average >= 80)
            .map(s => `<li>${escapeHTML(s.name)} - ${s.average.toFixed(1)}%</li>`)
            .join("");
    }

    if (support) {
        support.innerHTML = ranking
            .filter(s => s.records && s.average < 40)
            .map(s => `<li>${escapeHTML(s.name)} - ${s.average.toFixed(1)}%</li>`)
            .join("");
    }
}

function displaySubjectChart() {
    const chart = document.getElementById("subjectChart");
    if (!chart) return;

    const subjects = {};

    data.marks.forEach(m => {
        subjects[m.subject] ??= [];
        subjects[m.subject].push(percentage(m));
    });

    chart.innerHTML = Object.entries(subjects).map(([name, marks]) => {
        const avg = marks.reduce((a, b) => a + b, 0) / marks.length;

        return `
            <div class="chart-item">
                <span>${escapeHTML(name)}</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${avg}%"></div>
                </div>
                <span>${avg.toFixed(1)}%</span>
            </div>
        `;
    }).join("");
}

/* =====================================
   ATTENDANCE
===================================== */

function addAttendance(studentId, date, status) {
    if (!studentId || !date || !status) {
        alert("Please fill in all attendance details.");
        return false;
    }

    if (!data.students.some(s => s.id === studentId)) {
        alert("Student not found. Please register first.");
        return false;
    }

    if (data.attendance.some(a =>
        a.studentId === studentId && a.date === date
    )) {
        alert("Attendance for this student on this date already exists.");
        return false;
    }

    data.attendance.push({
        id: createId(),
        studentId,
        date,
        status
    });

    saveData();
    alert("Attendance saved successfully!");
    return true;
}

function displayAttendance(search = "") {
    const table = document.getElementById("attendanceTableBody");
    if (!table) return;

    const filtered = data.attendance.filter(record => {
        const student = data.students.find(s => s.id === record.studentId);
        return student &&
            student.name.toLowerCase().includes(search.toLowerCase());
    });

    if (!filtered.length) {
        table.innerHTML = `
            <tr><td colspan="4">No attendance records available.</td></tr>
        `;
        return;
    }

    table.innerHTML = filtered.map(record => {
        const student = data.students.find(s => s.id === record.studentId);

        return `
            <tr>
                <td>${escapeHTML(student?.name || "Unknown")}</td>
                <td>${escapeHTML(student?.enrollment || "-")}</td>
                <td>${escapeHTML(record.date)}</td>
                <td>${escapeHTML(record.status)}</td>
            </tr>
        `;
    }).join("");
}

function displayAttendanceStats() {
    const records = data.attendance;

    const present = records.filter(r => r.status === "Present").length;
    const absent = records.filter(r => r.status === "Absent").length;
    const late = records.filter(r => r.status === "Late").length;

    const rate = records.length
        ? ((present + late) / records.length) * 100
        : 0;

    setText("totalAttendanceRecords", records.length);
    setText("presentCount", present);
    setText("absentCount", absent);
    setText("attendanceRate", rate.toFixed(1) + "%");
}

/* =====================================
   IMPORT / EXPORT / SETTINGS
===================================== */

function exportData() {
    const file = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "student-records.json";
    link.click();

    URL.revokeObjectURL(url);
}

function importData(file) {
    const reader = new FileReader();

    reader.onload = () => {
        try {
            const imported = JSON.parse(reader.result);

            if (!imported ||
                !Array.isArray(imported.students) ||
                !Array.isArray(imported.marks) ||
                (imported.attendance !== undefined &&
                 !Array.isArray(imported.attendance))) {
                throw new Error("Invalid file format");
            }

            data = {
                students: imported.students,
                marks: imported.marks,
                attendance: imported.attendance || []
            };

            saveData();
            alert("Records imported successfully!");
        } catch (error) {
            alert("Unable to import. Please select a valid backup file.");
        }
    };

    reader.readAsText(file);
}

function displayStorageInfo() {
    const element = document.getElementById("storageInfo");
    if (!element) return;

    const size = new Blob([
        localStorage.getItem(STORAGE_KEY) || ""
    ]).size;

    element.textContent =
        `Students: ${data.students.length} | Marks: ${data.marks.length} | ` +
        `Data size: ${(size / 1024).toFixed(2)} KB`;
}

function clearAllRecords() {
    if (!confirm("Are you sure? This will delete all student records, marks and attendance.")) {
        return;
    }

    data = { students: [], marks: [], attendance: [] };
    saveData();
}

/* =====================================
   RENDER ALL PAGES
===================================== */

function renderAll() {
    displayStudents(
        document.getElementById("studentSearch")?.value || ""
    );

    populateStudentDropdown();
    populateAttendanceDropdown();

    displayMarks();
    displayDashboard();
    displayLeaderboard();
    displaySubjectAverages();
    displayPerformanceGroups();
    displayStorageInfo();

    displayAttendance(
        document.getElementById("attendanceSearch")?.value || ""
    );

    displayAttendanceStats();
}

/* =====================================
   EVENT LISTENERS
===================================== */

function initializeAcadTrack() {

    // Student registration
const studentForm = document.getElementById("studentForm");

if (studentForm) {
    studentForm.addEventListener("submit", event => {
        event.preventDefault();

        const success = addStudent({
            name: document.getElementById("studentName").value.trim(),
            enrollment: document.getElementById("enrollment").value.trim(),
            className: document.getElementById("studentClass").value.trim(),
            email: document.getElementById("studentEmail").value.trim(),
            phone: document.getElementById("studentPhone").value.trim(),
            admissionDate: document.getElementById("admissionDate").value
        });

        if (success) {
            studentForm.reset();
        }
    });
}

    // Marks form
    const marksForm = document.getElementById("marksForm");

    if (marksForm) {
        marksForm.addEventListener("submit", event => {
            event.preventDefault();

            const studentId = document.getElementById("marksStudent")?.value;
            const subject = document.getElementById("subjectName")?.value.trim();
            const exam = document.getElementById("examName")?.value;
            const obtained = document.getElementById("marksObtained")?.value;
            const total = document.getElementById("maximumMarks")?.value;

            if (addMarks(studentId, subject, exam, obtained, total)) {
                marksForm.reset();
                populateStudentDropdown();
            }
        });
    }

    // Attendance form
    const attendanceForm = document.getElementById("attendanceForm");

    if (attendanceForm) {
        attendanceForm.addEventListener("submit", event => {
            event.preventDefault();

            const success = addAttendance(
                document.getElementById("attendanceStudent")?.value,
                document.getElementById("attendanceDate")?.value,
                document.getElementById("attendanceStatus")?.value
            );

            if (success) attendanceForm.reset();
        });
    }

    // Searches
    document.getElementById("studentSearch")
        ?.addEventListener("input", event => displayStudents(event.target.value));

    document.getElementById("attendanceSearch")
        ?.addEventListener("input", event => displayAttendance(event.target.value));

    // Edit and delete actions
    document.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const id = button.dataset.id;

        switch (button.dataset.action) {
            case "delete-student":
                deleteStudent(id);
                break;

            case "delete-mark":
                deleteMarks(id);
                break;

            case "edit-student": {
                const student = data.students.find(s => s.id === id);
                if (!student) return;

                const name = prompt("Student name:", student.name);
                if (name === null) return;

                const enrollment = prompt("Enrollment number:", student.enrollment);
                if (enrollment === null) return;

                if (!name.trim() || !enrollment.trim() ||
                    data.students.some(s =>
                        s.id !== id &&
                        s.enrollment.toLowerCase() === enrollment.trim().toLowerCase()
                    )) {
                    alert("Invalid or duplicate student details.");
                    return;
                }

                editStudent(id, {
                    name: name.trim(),
                    enrollment: enrollment.trim()
                });
                break;
            }

            case "edit-mark": {
                const mark = data.marks.find(m => m.id === id);
                if (!mark) return;

                const obtained = prompt("Marks obtained:", mark.obtained);
                if (obtained === null) return;

                const total = prompt("Total marks:", mark.total);
                if (total === null) return;

                editMarks(id, obtained, total);
                break;
            }
        }
    });

    // Export
    document.getElementById("exportBtn")
        ?.addEventListener("click", exportData);

    // Import
    document.getElementById("importFile")
        ?.addEventListener("change", event => {
            if (event.target.files[0]) {
                importData(event.target.files[0]);
                event.target.value = "";
            }
        });

    // Clear
    document.getElementById("clearBtn")
        ?.addEventListener("click", clearAllRecords);

    renderAll();
    initializeReportCard();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAcadTrack);
} else {
    initializeAcadTrack();
}
/* =====================================
   REPORT CARD SYSTEM
===================================== */

function populateReportDropdown() {
    const dropdown = document.getElementById("reportStudent");

    if (!dropdown) return;

    const previousValue = dropdown.value;

    dropdown.innerHTML = `
        <option value="">Select a student</option>
        ${data.students.map(student => `
            <option value="${escapeHTML(student.id)}">
                ${escapeHTML(student.name)} (${escapeHTML(student.enrollment)})
            </option>
        `).join("")}
    `;

    if (data.students.some(s => s.id === previousValue)) {
        dropdown.value = previousValue;
    }
}

function generateReport(studentId, exam) {

    const student = data.students.find(
        s => s.id === studentId
    );

    if (!student) {
        alert("Please select a student.");
        return;
    }

    const records = data.marks.filter(mark =>
        mark.studentId === studentId &&
        (!exam || mark.exam === exam)
    );

    setText("reportStudentName", student.name);
    setText("reportEnrollment", student.enrollment);
    setText("reportClass", student.className || student.course || "-");
    setText("reportExamName", exam || "All Examinations");

    const tbody = document.getElementById("reportMarksBody");

    if (!records.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">No marks found for this student.</td>
            </tr>
        `;
        setText("reportTotalMarks", "0 / 0");
        setText("reportPercentage", "0%");
        setText("reportResult", "No Result");
        return;
    }

    tbody.innerHTML = records.map(mark => `
        <tr>
            <td>${escapeHTML(mark.subject)}</td>
            <td>${mark.total}</td>
            <td>${mark.obtained}</td>
            <td>${percentage(mark).toFixed(1)}%</td>
            <td>${resultStatus(mark)}</td>
        </tr>
    `).join("");

    const obtained = records.reduce(
        (sum, mark) => sum + mark.obtained, 0
    );

    const maximum = records.reduce(
        (sum, mark) => sum + mark.total, 0
    );

    const percent = maximum > 0
        ? obtained / maximum * 100
        : 0;

    const result = records.every(
        mark => resultStatus(mark) === "Pass"
    ) ? "Pass" : "Fail";

    setText("reportTotalMarks", `${obtained} / ${maximum}`);
    setText("reportPercentage", percent.toFixed(1) + "%");
    setText("reportResult", result);
}

/* REPORT CARD EVENT LISTENER */

function initializeReportCard() {

    const form = document.getElementById("reportForm");

    if (!form) return;

    populateReportDropdown();

    form.addEventListener("submit", event => {
        event.preventDefault();

        const studentId =
            document.getElementById("reportStudent").value;

        const exam =
            document.getElementById("reportExam").value;

        generateReport(studentId, exam);
    });
}
