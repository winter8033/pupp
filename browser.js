const { resolve } = require('path')
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// const puppeteer = require('puppeteer');
const proxyChain = require('proxy-chain');
const randUserAgent = require('rand-user-agent');
// const logger = require("../../util/logger-winston");
const fs = require('fs');
var { randomBytes } = require('crypto')

async function _getBrowser() {
    // test

    const google = 'https://www.bing.com/';

    // const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';
    const oldProxyUrl = 'http://1fSgSsRP:KjXUHNfi@92.61.64.95:63936';
    const newProxyUrl = await proxyChain.anonymizeProxy(oldProxyUrl);

    const chrome_extension = __dirname + '/jiidiaalihmmhddjgbnbgdfflelocpak/1.4.8_0'
    console.log("chrome_extension=", chrome_extension)
    const userAgent = getUserAgent();


    let browser = await puppeteer.launch(
        {
            headless: false,
            executablePath: '/usr/bin/google-chrome-stable',
            ignoreDefaultArgs: ['--enable-automation'],
            // ignoreHTTPSErrors: true,
            // defaultViewport: null,
            args: [
                '--no-sandbox',
                `--disable-extensions-except=${chrome_extension}`,
                '--user-data-dir',
                // '--ignore-certificate-errors',
                // '--disable-setuid-sandbox',
                // '--window-size=1920,1080',
                // "--disable-accelerated-2d-canvas",
                // "--disable-gpu"

                // '--start-fullscreen',
                // `--user-agent=${userAgent}`,
                // `--proxy-server=${newProxyUrl}`,
                // '--disable-blink-features=AutomationControlled'
            ],
        }
    );

    // const browser = await puppeteer.launch({
    //     headless: true,
    //     executablePath: '/usr/bin/google-chrome',
    //     args: [
    //         "--no-sandbox",
    //         "--disable-gpu",
    //     ]
    // });

    let page = await browser.newPage();
    console.log('browser open');

    await page.setUserAgent(userAgent);
    await page.setJavaScriptEnabled(true);
    await page.setDefaultNavigationTimeout(0);

    const vsitorid = randomSecret();
    console.log(vsitorid);
    const device_id = randomUUID();
    console.log(device_id);
    // 47073409e2261f744dd6e3ab5174fcb0
    // df6b47e3e6dfd83651d3e5cdd94aa433
    // Clean up, forcibly close all pending connections
    await page.goto('chrome-extension://jiidiaalihmmhddjgbnbgdfflelocpak/popup.html');
    // Take a screenshot of the extension page
    // console.log('==>Take Screenshot');
    // await page.screenshot({path: 'msedge-extension.png'});
    const localStorage1 = await page.evaluate(() => Object.assign({}, window.localStorage));
    console.log(localStorage1);
    let value = JSON.parse(localStorage1["ThinkingDataJSSDK_cross"]);
    value.device_id = device_id;
    value.distinct_id = device_id;
    await sleep(2000);
    // 给设置当前页面的clientId
    await page.evaluate(vsitorid => {
        window.localStorage.setItem('clientId', vsitorid);
    }, vsitorid);
    await page.evaluate(value => {
        window.localStorage.setItem('ThinkingDataJSSDK_cross', JSON.stringify(value));
    }, value);
    const pages = await browser.pages();
    for (let i = 0; i < pages.length; i++) {
        const newPage = pages[i];
        try {
            if (i == 1) {
                await newPage.bringToFront();
            } else {
                //关闭新tab页面
                await newPage.close();
            }
        } catch (err) {

        }
    }
    return [browser, page];
}

function getAgents() {
    // 保存
    const dataPath = getPath();
    let dataList;
    try {
        const data = fs.readFileSync(dataPath);
        // parse JSON object
        dataList = JSON.parse(data.toString());
    } catch (err) {
        const data1 = JSON.stringify([]);
        // write JSON string to a file
        fs.writeFileSync(dataPath, data1);
        console.log("JSON data is saved.");
        return [];
    }

    return dataList;
}

function saveAgentStr(agent = "") {
    if (agent.length == 0) {
        return;
    }
    const dataPath = getPath();
    const user_key_list = getAgents();
    // // print JSON object
    const length = user_key_list.length;
    // console.log(length);
    user_key_list.push(agent);
    const data1 = JSON.stringify(user_key_list);
    // // write JSON string to a file
    fs.writeFileSync(dataPath, data1);
    console.log("JSON data is saved.");
}

function getPath() {
    return './phAgent.json';
}

function getUserAgent() {
    let usAgent
    let loop = true;
    while (loop) {
        const agent = randUserAgent("chrome");
        if ((agent.indexOf("Macintosh") > -1 || agent.indexOf("Windows") > -1) && agent.indexOf("HeadlessChrome") == -1) {
            usAgent = agent;
            loop = false;
        }
    }
    console.log(usAgent);
    saveAgentStr(usAgent);
    return usAgent;
}

function randomSecret() {
    return randomBytes(16).toString('hex')
}

function randomUUID() {
    return "xxxxxxxxxxxxxx-xxxxxxxxxxxxxx-xxxxxxxx-1024000-xxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

async function sleep(t) {
    await new Promise((resolve) => setTimeout(resolve, t))
}

module.exports = {
    Browser: _getBrowser
};