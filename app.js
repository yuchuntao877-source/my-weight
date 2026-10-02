/* =========================================================
   我的体重 App
   数据全部保存在当前设备浏览器本地
========================================================= */


/* =========================================================
   数据
========================================================= */

let records = JSON.parse(localStorage.getItem("weightRecords")) || [];

let settings = JSON.parse(localStorage.getItem("weightSettings")) || {
    height: "",
    goalWeight: ""
};

let currentEditId = null;

let currentChartDays = 7;

let weightChart = null;


/* =========================================================
   工具函数
========================================================= */

// 保存记录
function saveRecords() {
    localStorage.setItem(
        "weightRecords",
        JSON.stringify(records)
    );
}


// 保存设置
function saveSettings() {
    localStorage.setItem(
        "weightSettings",
        JSON.stringify(settings)
    );
}


// 获取今天日期 YYYY-MM-DD
function getToday() {

    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// 日期格式化
function formatDate(dateString) {

    if (!dateString) return "";

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return `${parts[1]}月${parts[2]}日`;
}


// 完整日期
function formatFullDate(dateString) {

    if (!dateString) return "";

    const parts = dateString.split("-");

    return `${parts[0]}年${parts[1]}月${parts[2]}日`;
}


// 根据日期排序
function sortRecords() {

    records.sort((a, b) => {

        if (a.date !== b.date) {

            return b.date.localeCompare(a.date);

        }

        return (b.time || "").localeCompare(
            a.time || ""
        );
    });
}


// 保留两位小数
function formatWeight(value) {

    if (
        value === null ||
        value === undefined ||
        isNaN(value)
    ) {
        return "--";
    }

    return Number(value).toFixed(2);
}


/* =========================================================
   日期显示
========================================================= */

function updateTodayDate() {

    const element =
        document.getElementById("todayDate");

    if (!element) return;

    const today = new Date();

    const year = today.getFullYear();

    const month = today.getMonth() + 1;

    const day = today.getDate();

    const weekNames = [
        "星期日",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六"
    ];

    const week =
        weekNames[today.getDay()];

    element.textContent =
        `${year}年${month}月${day}日 ${week}`;
}


/* =========================================================
   首页
========================================================= */

function updateHome() {

    sortRecords();

    const currentWeightElement =
        document.getElementById("currentWeight");

    const changeElement =
        document.getElementById("weightChange");

    const goalWeightText =
        document.getElementById("goalWeightText");

    const startWeightText =
        document.getElementById("startWeightText");

    const remainWeightText =
        document.getElementById("remainWeightText");

    const progressBar =
        document.getElementById("goalProgress");


    // 没有数据
    if (records.length === 0) {

        currentWeightElement.textContent = "--";

        changeElement.textContent =
            "还没有体重记录";

        changeElement.className =
            "weight-change";

        startWeightText.textContent =
            "起始 -- kg";

        remainWeightText.textContent =
            "还差 -- kg";

        progressBar.style.width = "0%";

    } else {

        const current = records[0];

        const currentWeight =
            Number(current.weight);

        currentWeightElement.textContent =
            formatWeight(currentWeight);


        // 找昨天的记录
        const yesterday =
            getDateBefore(current.date, 1);

        const yesterdayRecords =
            records.filter(
                item => item.date === yesterday
            );


        if (yesterdayRecords.length > 0) {

            const yesterdayWeight =
                Number(
                    yesterdayRecords[0].weight
                );

            const change =
                currentWeight -
                yesterdayWeight;


            if (change < 0) {

                changeElement.textContent =
                    `↓ ${Math.abs(change).toFixed(2)} kg 较昨日`;

                changeElement.className =
                    "weight-change down";

            } else if (change > 0) {

                changeElement.textContent =
                    `↑ ${change.toFixed(2)} kg 较昨日`;

                changeElement.className =
                    "weight-change up";

            } else {

                changeElement.textContent =
                    "→ 与昨日相同";

                changeElement.className =
                    "weight-change";

            }

        } else {

            changeElement.textContent =
                "暂无昨日数据";

            changeElement.className =
                "weight-change";
        }


        // 起始体重
        const sortedAscending =
            [...records].sort(
                (a, b) =>
                    a.date.localeCompare(b.date)
            );

        const firstWeight =
            Number(
                sortedAscending[0].weight
            );

        startWeightText.textContent =
            `起始 ${formatWeight(firstWeight)} kg`;


        // 目标体重
        const goal =
            Number(settings.goalWeight);


        if (goal > 0) {

            goalWeightText.textContent =
                `${formatWeight(goal)} kg`;


            const difference =
                currentWeight - goal;


            if (Math.abs(difference) < 0.01) {

                remainWeightText.textContent =
                    "已达到目标 🎉";

            } else if (difference > 0) {

                remainWeightText.textContent =
                    `还差 ${difference.toFixed(2)} kg`;

            } else {

                remainWeightText.textContent =
                    `已低于目标 ${Math.abs(difference).toFixed(2)} kg`;
            }


            // 计算进度
            let progress = 0;


            if (firstWeight !== goal) {

                progress =
                    (
                        (firstWeight - currentWeight) /
                        (firstWeight - goal)
                    ) * 100;

            } else {

                progress = 100;
            }


            progress =
                Math.max(
                    0,
                    Math.min(
                        100,
                        progress
                    )
                );


            progressBar.style.width =
                `${progress}%`;

        } else {

            goalWeightText.textContent =
                "未设置";

            remainWeightText.textContent =
                "请在设置中填写目标";

            progressBar.style.width =
                "0%";
        }
    }


    updateAverages();

    updateChart();
}


/* =========================================================
   日期计算
========================================================= */

function getDateBefore(
    dateString,
    days
) {

    const date =
        new Date(dateString + "T00:00:00");

    date.setDate(
        date.getDate() - days
    );

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   平均体重
========================================================= */

function getAverage(days) {

    if (records.length === 0) {
        return null;
    }

    const today =
        getToday();

    const startDate =
        getDateBefore(
            today,
            days - 1
        );


    const list =
        records.filter(
            item =>
                item.date >= startDate &&
                item.date <= today
        );


    if (list.length === 0) {
        return null;
    }


    const total =
        list.reduce(
            (sum, item) =>
                sum + Number(item.weight),
            0
        );


    return total / list.length;
}


function updateAverages() {

    const avg7 =
        getAverage(7);

    const avg30 =
        getAverage(30);


    document.getElementById("avg7")
        .textContent =
        avg7 === null
            ? "--"
            : avg7.toFixed(2);


    document.getElementById("avg30")
        .textContent =
        avg30 === null
            ? "--"
            : avg30.toFixed(2);
}


/* =========================================================
   趋势图
========================================================= */

function updateChart() {

    const canvas =
        document.getElementById(
            "weightChart"
        );

    const emptyChart =
        document.getElementById(
            "emptyChart"
        );


    if (!canvas) return;


    const today =
        getToday();


    const startDate =
        getDateBefore(
            today,
            currentChartDays - 1
        );


    const list =
        records
            .filter(
                item =>
                    item.date >= startDate &&
                    item.date <= today
            )
            .sort(
                (a, b) =>
                    a.date.localeCompare(b.date)
            );


    if (list.length < 2) {

        canvas.style.display =
            "none";

        emptyChart.style.display =
            "block";

        if (weightChart) {

            weightChart.destroy();

            weightChart = null;
        }

        return;
    }


    canvas.style.display =
        "block";

    emptyChart.style.display =
        "none";


    const labels =
        list.map(
            item =>
                formatDate(item.date)
        );


    const values =
        list.map(
            item =>
                Number(item.weight)
        );


    if (weightChart) {

        weightChart.destroy();
    }


    const ctx =
        canvas.getContext("2d");


    weightChart =
        new Chart(
            ctx,
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            data: values,

                            borderWidth: 3,

                            pointRadius: 4,

                            pointHoverRadius: 6,

                            tension: 0.35,

                            fill: false,

                            borderColor: "#111111",

                            backgroundColor:
                                "#111111"

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,


                    plugins: {

                        legend: {
                            display: false
                        }

                    },


                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            ticks: {
                                color: "#999999",
                                font: {
                                    size: 11
                                }
                            }

                        },


                        y: {

                            grid: {
                                color: "#eeeeee"
                            },

                            ticks: {

                                color: "#999999",

                                font: {
                                    size: 11
                                }

                            }

                        }

                    }


                }

            }
        );
}


/* =========================================================
   历史记录
========================================================= */

function updateHistory() {

    sortRecords();


    const listElement =
        document.getElementById(
            "historyList"
        );

    const countElement =
        document.getElementById(
            "recordCount"
        );


    countElement.textContent =
        `${records.length} 条`;


    if (records.length === 0) {

        listElement.innerHTML = `
            <div class="empty-history">
                还没有体重记录
            </div>
        `;

        return;
    }


    listElement.innerHTML =
        records.map(
            record => `

            <div
                class="history-item"
                data-id="${record.id}"
            >

                <div class="history-left">

                    <div class="history-date">
                        ${formatFullDate(record.date)}
                    </div>

                    ${
                        record.note
                        ?
                        `<div class="history-note">
                            ${escapeHtml(record.note)}
                        </div>`
                        :
                        ""
                    }

                </div>


                <div class="history-right">

                    <div class="history-weight">
                        ${formatWeight(record.weight)} kg
                    </div>

                    <div class="history-actions">

                        <button
                            onclick="editRecord('${record.id}')"
                        >
                            修改
                        </button>

                        <button
                            onclick="deleteRecord('${record.id}')"
                        >
                            删除
                        </button>

                    </div>

                </div>

            </div>

        `
        ).join("");
}


/* =========================================================
   防止备注出现 HTML 问题
========================================================= */

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}


/* =========================================================
   添加体重
========================================================= */

function openAddModal() {

    const modal =
        document.getElementById(
            "weightModal"
        );

    const weightInput =
        document.getElementById(
            "weightInput"
        );

    const dateInput =
        document.getElementById(
            "dateInput"
        );

    const noteInput =
        document.getElementById(
            "noteInput"
        );


    weightInput.value = "";

    dateInput.value =
        getToday();

    noteInput.value = "";


    modal.classList.add("show");


    setTimeout(
        () => weightInput.focus(),
        200
    );
}


function closeAddModal() {

    document
        .getElementById(
            "weightModal"
        )
        .classList.remove("show");
}


/* =========================================================
   保存体重
========================================================= */

function saveWeight() {

    const weightInput =
        document.getElementById(
            "weightInput"
        );

    const dateInput =
        document.getElementById(
            "dateInput"
        );

    const noteInput =
        document.getElementById(
            "noteInput"
        );


    const weight =
        Number(weightInput.value);

    const date =
        dateInput.value;

    const note =
        noteInput.value.trim();


    if (
        !weight ||
        weight < 20 ||
        weight > 300
    ) {

        alert(
            "请输入正确的体重，例如 72.40 kg"
        );

        weightInput.focus();

        return;
    }


    if (!date) {

        alert("请选择日期");

        return;
    }


    // 同一天已有记录
    const existing =
        records.find(
            item =>
                item.date === date
        );


    if (existing) {

        const confirmReplace =
            confirm(
                "这一天已经有体重记录，是否用新的数据替换？"
            );


        if (!confirmReplace) {

            return;
        }


        existing.weight =
            weight;

        existing.note =
            note;

        existing.time =
            new Date().toTimeString();

    } else {

        records.push({

            id:
                Date.now().toString(),

            date:
                date,

            time:
                new Date().toTimeString(),

            weight:
                weight,

            note:
                note

        });

    }


    saveRecords();

    closeAddModal();

    updateAll();
}


/* =========================================================
   编辑记录
========================================================= */

function editRecord(id) {

    const record =
        records.find(
            item =>
                item.id === id
        );


    if (!record) return;


    currentEditId =
        id;


    document.getElementById(
        "editWeightInput"
    ).value =
        record.weight;


    document.getElementById(
        "editDateInput"
    ).value =
        record.date;


    document.getElementById(
        "editNoteInput"
    ).value =
        record.note || "";


    document
        .getElementById(
            "editModal"
        )
        .classList.add("show");
}


function closeEditModal() {

    document
        .getElementById(
            "editModal"
        )
        .classList.remove("show");

    currentEditId =
        null;
}


/* =========================================================
   保存修改
========================================================= */

function updateWeight() {

    if (!currentEditId) return;


    const record =
        records.find(
            item =>
                item.id === currentEditId
        );


    if (!record) return;


    const weight =
        Number(
            document.getElementById(
                "editWeightInput"
            ).value
        );


    const date =
        document.getElementById(
            "editDateInput"
        ).value;


    const note =
        document.getElementById(
            "editNoteInput"
        ).value.trim();


    if (
        !weight ||
        weight < 20 ||
        weight > 300
    ) {

        alert("请输入正确的体重");

        return;
    }


    if (!date) {

        alert("请选择日期");

        return;
    }


    // 防止修改后和其他记录日期重复
    const duplicate =
        records.find(
            item =>
                item.id !== currentEditId &&
                item.date === date
        );


    if (duplicate) {

        alert(
            "这个日期已经存在另一条记录，请换一个日期。"
        );

        return;
    }


    record.weight =
        weight;

    record.date =
        date;

    record.note =
        note;


    saveRecords();

    closeEditModal();

    updateAll();
}


/* =========================================================
   删除记录
========================================================= */

function deleteRecord(id) {

    const record =
        records.find(
            item =>
                item.id === id
        );


    if (!record) return;


    const confirmDelete =
        confirm(
            `确定删除 ${formatFullDate(record.date)} 的体重记录吗？`
        );


    if (!confirmDelete) {

        return;
    }


    records =
        records.filter(
            item =>
                item.id !== id
        );


    saveRecords();

    updateAll();
}


/* =========================================================
   设置
========================================================= */

function loadSettings() {

    document.getElementById(
        "heightInput"
    ).value =
        settings.height || "";


    document.getElementById(
        "goalInput"
    ).value =
        settings.goalWeight || "";
}


function saveSettingsFromForm() {

    const height =
        Number(
            document.getElementById(
                "heightInput"
            ).value
        );


    const goalWeight =
        Number(
            document.getElementById(
                "goalInput"
            ).value
        );


    if (
        height &&
        (
            height < 100 ||
            height > 250
        )
    ) {

        alert(
            "请输入 100–250 cm 之间的身高"
        );

        return;
    }


    if (
        goalWeight &&
        (
            goalWeight < 20 ||
            goalWeight > 300
        )
    ) {

        alert(
            "请输入 20–300 kg 之间的目标体重"
        );

        return;
    }


    settings.height =
        height || "";

    settings.goalWeight =
        goalWeight || "";


    saveSettings();

    updateAll();


    alert("设置已保存");
}


/* =========================================================
   数据统计
========================================================= */

function updateStatistics() {

    const totalRecords =
        document.getElementById(
            "totalRecords"
        );

    const maxWeight =
        document.getElementById(
            "maxWeight"
        );

    const minWeight =
        document.getElementById(
            "minWeight"
        );

    const overallAverage =
        document.getElementById(
            "overallAverage"
        );

    const currentBMI =
        document.getElementById(
            "currentBMI"
        );

    const totalChange =
        document.getElementById(
            "totalChange"
        );


    totalRecords.textContent =
        records.length;


    if (records.length === 0) {

        maxWeight.textContent =
            "--";

        minWeight.textContent =
            "--";

        overallAverage.textContent =
            "--";

        currentBMI.textContent =
            "--";

        totalChange.textContent =
            "--";

        document.getElementById(
            "bmiValue"
        ).textContent =
            "--";

        document.getElementById(
            "bmiStatus"
        ).textContent =
            "请先记录体重并设置身高";

        return;
    }


    const weights =
        records.map(
            item =>
                Number(item.weight)
        );


    const max =
        Math.max(...weights);

    const min =
        Math.min(...weights);


    const average =
        weights.reduce(
            (a, b) => a + b,
            0
        ) / weights.length;


    maxWeight.textContent =
        `${max.toFixed(2)} kg`;

    minWeight.textContent =
        `${min.toFixed(2)} kg`;

    overallAverage.textContent =
        `${average.toFixed(2)} kg`;


    // 当前体重
    sortRecords();

    const current =
        Number(
            records[0].weight
        );


    // 累计变化
    const ascending =
        [...records].sort(
            (a, b) =>
                a.date.localeCompare(
                    b.date
                )
        );


    const first =
        Number(
            ascending[0].weight
        );


    const change =
        current - first;


    if (change > 0) {

        totalChange.textContent =
            `+${change.toFixed(2)} kg`;

    } else {

        totalChange.textContent =
            `${change.toFixed(2)} kg`;
    }


    // BMI
    updateBMI();
}


/* =========================================================
   BMI
========================================================= */

function updateBMI() {

    const bmiValue =
        document.getElementById(
            "bmiValue"
        );

    const bmiStatus =
        document.getElementById(
            "bmiStatus"
        );


    if (
        records.length === 0 ||
        !settings.height
    ) {

        bmiValue.textContent =
            "--";

        bmiStatus.textContent =
            "请先设置身高";

        return;
    }


    sortRecords();


    const weight =
        Number(
            records[0].weight
        );


    const height =
        Number(
            settings.height
        ) / 100;


    const bmi =
        weight /
        (height * height);


    bmiValue.textContent =
        bmi.toFixed(1);


    if (bmi < 18.5) {

        bmiStatus.textContent =
            "偏瘦";

    } else if (bmi < 24) {

        bmiStatus.textContent =
            "正常";

    } else if (bmi < 28) {

        bmiStatus.textContent =
            "超重";

    } else {

        bmiStatus.textContent =
            "肥胖";
    }


    document.getElementById(
        "currentBMI"
    ).textContent =
        bmi.toFixed(1);
}


/* =========================================================
   页面切换
========================================================= */

function switchPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(
            page => {

                page.classList.remove(
                    "active"
                );

            }
        );


    document
        .getElementById(pageId)
        .classList.add(
            "active"
        );


    document
        .querySelectorAll(".nav-item")
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );


                if (
                    item.dataset.page ===
                    pageId
                ) {

                    item.classList.add(
                        "active"
                    );

                }

            }
        );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (pageId === "historyPage") {

        updateHistory();

    }


    if (pageId === "statsPage") {

        updateStatistics();

    }


    if (pageId === "settingsPage") {

        loadSettings();

    }
}


/* =========================================================
   全部刷新
========================================================= */

function updateAll() {

    updateTodayDate();

    updateHome();

    updateHistory();

    updateStatistics();

    loadSettings();
}


/* =========================================================
   事件绑定
========================================================= */

function initEvents() {

    // 添加体重
    document
        .getElementById(
            "addWeightBtn"
        )
        .addEventListener(
            "click",
            openAddModal
        );


    // 关闭添加弹窗
    document
        .getElementById(
            "closeModalBtn"
        )
        .addEventListener(
            "click",
            closeAddModal
        );


    // 保存体重
    document
        .getElementById(
            "saveWeightBtn"
        )
        .addEventListener(
            "click",
            saveWeight
        );


    // 关闭编辑弹窗
    document
        .getElementById(
            "closeEditModalBtn"
        )
        .addEventListener(
            "click",
            closeEditModal
        );


    // 保存修改
    document
        .getElementById(
            "updateWeightBtn"
        )
        .addEventListener(
            "click",
            updateWeight
        );


    // 保存设置
    document
        .getElementById(
            "saveSettingsBtn"
        )
        .addEventListener(
            "click",
            saveSettingsFromForm
        );


    // 底部导航
    document
        .querySelectorAll(".nav-item")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        switchPage(
                            button.dataset.page
                        );

                    }
                );

            }
        );


    // 7天 / 30天
    document
        .querySelectorAll(".period-btn")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".period-btn"
                            )
                            .forEach(
                                btn =>
                                    btn.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add(
                            "active"
                        );


                        currentChartDays =
                            Number(
                                button.dataset.days
                            );


                        updateChart();

                    }
                );

            }
        );


    // 点击添加弹窗背景关闭
    document
        .getElementById(
            "weightModal"
        )
        .addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "weightModal"
                ) {

                    closeAddModal();

                }

            }
        );


    // 点击编辑弹窗背景关闭
    document
        .getElementById(
            "editModal"
        )
        .addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "editModal"
                ) {

                    closeEditModal();

                }

            }
        );


    // 清空数据
    document
        .getElementById(
            "clearDataBtn"
        )
        .addEventListener(
            "click",
            clearAllData
        );
}


/* =========================================================
   清空全部数据
========================================================= */

function clearAllData() {

    const confirmed =
        confirm(
            "确定要删除所有体重记录和设置吗？\n\n这个操作无法恢复。"
        );


    if (!confirmed) {

        return;
    }


    records = [];

    settings = {
        height: "",
        goalWeight: ""
    };


    localStorage.removeItem(
        "weightRecords"
    );

    localStorage.removeItem(
        "weightSettings"
    );


    updateAll();


    alert("所有数据已经清空");
}


/* =========================================================
   初始化
========================================================= */

function init() {

    sortRecords();

    initEvents();

    updateAll();
}


// 页面加载完成
document.addEventListener(
    "DOMContentLoaded",
    init
);