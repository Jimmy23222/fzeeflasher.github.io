let espStub;

const baudRates = 115200;

const bufferSize = 512;
const colors = ["#00a7e9", "#f89521", "#be1e2d"];
const measurementPeriodId = "0001";

const maxLogLength = 100;
const log = document.getElementById("log");
const butConnect = document.getElementById("butConnect");
const butClear = document.getElementById("butClear");
const butErase = document.getElementById("butErase");
const butProgram = document.getElementById("butProgram");
const autoscroll = document.getElementById("autoscroll");
const darkSS = document.getElementById("dark");
const lightSS = document.getElementById("light");
const darkMode = document.getElementById("darkmode");
const firmware = document.querySelectorAll(".upload .firmware input");
const progress = document.querySelectorAll(".upload .progress-bar");
const modelSelect = document.getElementById("modelSelect");
const versionSelect = document.getElementById("versionSelect");
const variantSelect = document.getElementById("variantSelect");
const offsets = [0x1000, 0x8000, 0xE000, 0x10000];
const Mpreviouss2Files = {
    'bootloader': 'resources/S2/core/esp32_marauder.ino.bootloader.bin',
    'partitions': 'resources/S2/core/esp32_marauder.ino.partitions.bin',
    'boot_app0': 'resources/S2/core/boot_app0.bin',
    'firmware': 'resources/S2/marauder/previous/esp32_marauder_v0_13_2_20231018_flipper_sd_serial.bin',
};
const Mlatests2Files = {
    'bootloader': 'resources/S2/core/esp32_marauder.ino.bootloader.bin',
    'partitions': 'resources/S2/core/esp32_marauder.ino.partitions.bin',
    'boot_app0': 'resources/S2/core/boot_app0.bin',
    'firmware': 'resources/S2/marauder/latest/esp32_marauder_v0_13_3_20231026_flipper_sd_serial.bin',
};
const Epreviouss2Files = {
    'bootloader': 'resources/S2/evilportal/latest/EvilPortal.ino.bootloader.bin',
    'partitions': 'resources/S2/evilportal/latest/EvilPortal.ino.partitions.bin',
    'boot_app0': 'resources/S2/evilportal/latest/boot_app0.bin',
    'firmware': 'resources/S2/evilportal/latest/EvilPortal.ino.bin',
};
const Elatests2Files = {
    'bootloader': 'resources/S2/evilportal/latest/EvilPortal.ino.bootloader.bin',
    'partitions': 'resources/S2/evilportal/latest/EvilPortal.ino.partitions.bin',
    'boot_app0': 'resources/S2/evilportal/latest/boot_app0.bin',
    'firmware': 'resources/S2/evilportal/latest/EvilPortal.ino.bin',
};
const MpreviousvroomFiles = {
    'bootloader': 'resources/VROOM/core/esp32_marauder.ino.bootloader.bin',
    'partitions': 'resources/VROOM/core/esp32_marauder.ino.partitions.bin',
    'boot_app0': 'resources/VROOM/core/boot_app0.bin',
    'firmware': 'resources/VROOM/marauder/previous/esp32_marauder_v0_13_2_20231018_old_hardware.bin',
};
const MlatestvroomFiles = {
    'bootloader': 'resources/VROOM/core/esp32_marauder.ino.bootloader.bin',
    'partitions': 'resources/VROOM/core/esp32_marauder.ino.partitions.bin',
    'boot_app0': 'resources/VROOM/core/boot_app0.bin',
    'firmware': 'resources/VROOM/marauder/latest/esp32_marauder_v0_13_3_20231026_old_hardware.bin',
};
const EpreviousvroomFiles = {
    'bootloader': 'resources/VROOM/evilportal/latest/EvilPortal.ino.bootloader.bin',
    'partitions': 'resources/VROOM/evilportal/latest/EvilPortal.ino.partitions.bin',
    'boot_app0': 'resources/VROOM/evilportal/latest/boot_app0.bin',
    'firmware': 'resources/VROOM/evilportal/latest/EvilPortal.ino.bin',
};
const ElatestvroomFiles = {
    'bootloader': 'resources/VROOM/evilportal/latest/EvilPortal.ino.bootloader.bin',
    'partitions': 'resources/VROOM/evilportal/latest/EvilPortal.ino.partitions.bin',
    'boot_app0': 'resources/VROOM/evilportal/latest/boot_app0.bin',
    'firmware': 'resources/VROOM/evilportal/latest/EvilPortal.ino.bin',
};
const otherModelFiles = {
    'bootloader': 'resources/esp32_marauder.ino.bootloader.bin',
    'partitions': 'resources/esp32_marauder.ino.partitions.bin',
    'boot_app0': 'resources/boot_app0.bin',
    'firmware': 'resources/esp32_marauder_v0_13_3_20231026_flipper_sd_serial.bin',
};
const appDiv = document.getElementById("app");

document.addEventListener("DOMContentLoaded", () => {
    butConnect.addEventListener("click", () => {
        clickConnect().catch(async (e) => {
            console.error(e);
            errorMsg(e.message || e);
            if (espStub) {
                await espStub.disconnect();
            }
            toggleUIConnected(false);
        });
    });
    butClear.addEventListener("click", clickClear);
    butErase.addEventListener("click", clickErase);
    butProgram.addEventListener("click", clickProgram);
    autoscroll.addEventListener("click", clickAutoscroll);
    darkMode.addEventListener("change", clickDarkMode);
    window.addEventListener("error", function (event) {
        console.log("Got an uncaught error: ", event.error);
    });
    if ("serial" in navigator) {
        const notSupported = document.getElementById("notSupported");
        notSupported.classList.add("hidden");
    }
    modelSelect.addEventListener("change", () => {
        const selectedModel = modelSelect.value;
        // Handle model change if needed
    });

    versionSelect.addEventListener("change", () => {
        const selectedVersion = versionSelect.value;
        // Handle version change if needed
    });

    variantSelect.addEventListener("change", () => {
        const selectedVarient = variantSelect.value;
        // Handle varient change if needed
    });
    loadAllSettings();
    updateTheme();
    logMsg("ESP Web Flasher loaded.");
});

function logMsg(text) {
    log.innerHTML += text + "<br>";

    if (log.textContent.split("\n").length > maxLogLength + 1) {
        let logLines = log.innerHTML.replace(/(\n)/gm, "").split("<br>");
        log.innerHTML = logLines.splice(-maxLogLength).join("<br>\n");
    }

    if (autoscroll.checked) {
        log.scrollTop = log.scrollHeight;
    }
}

function debugMsg(...args) {
    function getStackTrace() {
        let stack = new Error().stack;
        stack = stack.split("\n").map((v) => v.trim());
        stack.shift();
        stack.shift();

        let trace = [];
        for (let line of stack) {
            line = line.replace("at ", "");
            trace.push({
                func: line.substr(0, line.indexOf("(") - 1),
                pos: line.substring(line.indexOf(".js:") + 4, line.lastIndexOf(":")),
            });
        }

        return trace;
    }

    let stack = getStackTrace();
    stack.shift();
    let top = stack.shift();
    let prefix =
        '<span class="debug-function">[' + top.func + ":" + top.pos + "]</span> ";
    for (let arg of args) {
        if (typeof arg == "string") {
            logMsg(prefix + arg);
        } else if (typeof arg == "number") {
            logMsg(prefix + arg);
        } else if (typeof arg == "boolean") {
            logMsg(prefix + (arg ? "true" : "false"));
        } else if (Array.isArray(arg)) {
            logMsg(prefix + "[" + arg.map((value) => toHex(value)).join(", ") + "]");
        } else if (typeof arg == "object" && arg instanceof Uint8Array) {
            logMsg(
                prefix +
                "[" +
                Array.from(arg)
                    .map((value) => toHex(value))
                    .join(", ") +
                "]"
            );
        } else {
            logMsg(prefix + "Unhandled type of argument:" + typeof arg);
            console.log(arg);
        }
        prefix = "";
    }
}

function errorMsg(text) {
    logMsg('<span class="error-message">Error:</span> ' + text);
    console.log(text);
}

function updateTheme() {
    const selectedStyleSheet = darkMode.checked ? darkSS : lightSS;
    document.querySelectorAll("link[rel=stylesheet].alternate").forEach((styleSheet) => {
        enableStyleSheet(styleSheet, styleSheet === selectedStyleSheet);
    });
    saveSetting("darkmode", darkMode.checked);
}

function enableStyleSheet(node, enabled) {
    node.disabled = !enabled;
}

function formatMacAddr(macAddr) {
    return macAddr
        .map((value) => value.toString(16).toUpperCase().padStart(2, "0"))
        .join(":");
}

async function clickConnect() {
    if (espStub) {
        await espStub.disconnect();
        await espStub.port.close();
        toggleUIConnected(false);
        espStub = undefined;
        return;
    }

    const esploaderMod = await window.esptoolPackage;

    const esploader = await esploaderMod.connect({
        log: (...args) => logMsg(...args),
        debug: (...args) => debugMsg(...args),
        error: (...args) => errorMsg(...args),
    });
    try {
        await esploader.initialize();

        logMsg("Connected to " + esploader.chipName);
        logMsg("MAC Address: " + formatMacAddr(esploader.macAddr()));

        espStub = await esploader.runStub();
        toggleUIConnected(true);
        toggleUIToolbar(true);
        espStub.addEventListener("disconnect", () => {
            toggleUIConnected(false);
            espStub = false;
        });
    } catch (err) {
        await esploader.disconnect();
        throw err;
    }
}

async function changeBaudRate() {
    saveSetting("baudrate", baudRate.value);
    if (espStub) {
        let baud = parseInt(baudRate.value);
        if (baudRates.includes(baud)) {
            await espStub.setBaudrate(baud);
        }
    }
}

async function clickAutoscroll() {
    saveSetting("autoscroll", autoscroll.checked);
}

async function clickDarkMode() {
    updateTheme();
    saveSetting("darkmode", darkMode.checked);
}

async function clickErase() {
    if (window.confirm("This will erase the entire flash. Click OK to continue.")) {
        butErase.disabled = true;
        butProgram.disabled = true;
        try {
            logMsg("Erasing flash memory. Please wait...");
            let stamp = Date.now();
            await espStub.eraseFlash();
            logMsg("Finished. Took " + (Date.now() - stamp) + "ms to erase.");
        } catch (e) {
            errorMsg(e);
        } finally {

            butProgram.disabled = false;
        }
    }
}
async function clickProgram() {
    const readUploadedFileAsArrayBuffer = (inputFile) => {
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onerror = () => {
                reader.abort();
                reject(new DOMException("Problem parsing input file."));
            };

            reader.onload = () => {
                resolve(reader.result);
            };
            reader.readAsArrayBuffer(inputFile);
        });
    };

    const selectedModel = modelSelect.value;
    const selectedVersion = versionSelect.value;
    const selectedVariant = variantSelect.value;

    const isAnyDropdownNull = [selectedModel, selectedVersion, selectedVariant].includes("NULL");

    if (isAnyDropdownNull) {
        butProgram.disabled = true;
        return;
    }

    let selectedFiles;

    if (selectedModel === "S2") {
        selectedFiles = selectedVersion === "latest" ? (selectedVariant === "Marauder" ? Mlatests2Files : Elatests2Files) : (selectedVariant === "Marauder" ? Mpreviouss2Files : Epreviouss2Files);
    } else if (selectedModel === "VROOM") {
        selectedFiles = selectedVersion === "latest" ? (selectedVariant === "Marauder" ? MlatestvroomFiles : ElatestvroomFiles) : (selectedVariant === "Marauder" ? MpreviousvroomFiles : EpreviousvroomFiles);
    }

    butErase.disabled = true;
    butProgram.disabled = true;

    const fileTypes = ['bootloader', 'partitions', 'boot_app0', 'firmware'];

    for (let fileType of fileTypes) {
        let fileResource = selectedFiles[fileType];

        try {
            let offset = [0x1000, 0x8000, 0xE000, 0x10000][fileTypes.indexOf(fileType)];

            const progressBar = document.getElementById(fileType + 'Progress');
            progressBar.classList.remove("hidden");

            let binfile = new File([await fetch(fileResource).then(r => r.blob())], fileType + ".bin");
            let contents = await readUploadedFileAsArrayBuffer(binfile);

            await espStub.flashData(
                contents,
                (bytesWritten, totalBytes) => {
                    progressBar.style.width = Math.floor((bytesWritten / totalBytes) * 100) + "%";
                },
                offset
            );
            
            await sleep(100);
        } catch (e) {
            errorMsg(e);
        } finally {
            const progressBar = document.getElementById(fileType + 'Progress');
            progressBar.classList.add("hidden");
            progressBar.style.width = "0";
        }
    }

    butErase.disabled = false;
    butProgram.disabled = false;
    logMsg("To run the new firmware, please reset your device.");
}

async function clickClear() {
    reset();
}

function convertJSON(chunk) {
    try {
        let jsonObj = JSON.parse(chunk);
        return jsonObj;
    } catch (e) {
        return chunk;
    }
}

function toggleUIToolbar(show) {
    isConnected = show;
    for (let i = 0; i < 1; i++) {
        progress[i].classList.add("hidden");
        progress[i].querySelector("div").style.width = "0";
    }
    if (show) {
        appDiv.classList.add("connected");
    } else {
        appDiv.classList.remove("connected");
    }
    butErase.disabled = !show;
    butProgram.disabled = !show;
}

function toggleUIConnected(connected) {
    let lbl = "Connect";
    if (connected) {
        lbl = "Disconnect";
    } else {
        toggleUIToolbar(false);
    }
    butConnect.textContent = lbl;
}

function loadAllSettings() {
    autoscroll.checked = loadSetting("autoscroll", true);
    darkMode.checked = loadSetting("darkmode", false);
}

function loadSetting(setting, defaultValue) {
    let value = JSON.parse(window.localStorage.getItem(setting));
    if (value == null) {
        return defaultValue;
    }

    return value;
}

function saveSetting(setting, value) {
    window.localStorage.setItem(setting, JSON.stringify(value));
}

function ucWords(text) {
    return text
        .replace("_", " ")
        .toLowerCase()
        .replace(/(?<= )[^\s]|^./g, (a) => a.toUpperCase());
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
