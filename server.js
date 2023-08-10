const express = require('express');
const { Browser } = require("./browser")
var { randomBytes } = require('crypto')
const { utils, ethers } = require("ethers")

const fs = require('fs');

const app = express();

app.get('/screenshot', async (req, res) => {
    console.log('start');
    const [, page] = await Browser();
    await sleep(6000);
    await createNewAccount(page);
    await sleep(30000);

});

app.listen(3001, () => {
    console.log('Listening on port 3001');
});

async function createNewAccount(page) {
    if (!page) {
        return;
    }
    await sleep(3000);
    // 1. 先点击 创建新钱包 按钮
    await page.waitForSelector("button[class='MuiButtonBase-root welcomeBtnItem newwallet animate__backInUp animate__animated animate__delay-1s']");
    // 先点击 创建新钱包 按钮
    await page.click("button[class='MuiButtonBase-root welcomeBtnItem newwallet animate__backInUp animate__animated animate__delay-1s']");
    // 2. 设置密码
    await page.waitForSelector("input[class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd MuiOutlinedInput-inputAdornedEnd']");
    await page.waitForSelector("input[class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd MuiOutlinedInput-inputAdornedEnd']");
    const password = 'qwer134adsf';
    //获取输入框元素并在输入框内输入‘password’
    const inputs = await page.$$("input[class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputAdornedEnd MuiOutlinedInput-inputAdornedEnd']");
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        await input.type(password);
    }
    // 3. 点击下一步按钮
    await page.waitForSelector("button[class='MuiButtonBase-root MuiButton-root MuiButton-contained borderRadius8 nextBtn   MuiButton-containedPrimary']");
    await page.click("button[class='MuiButtonBase-root MuiButton-root MuiButton-contained borderRadius8 nextBtn   MuiButton-containedPrimary']");
    // 4. 展开助记词
    await sleep(2000);
    await page.waitForSelector("div[class='mark']");
    await page.click("div[class='mark']");
    // // 5. 保存助记词
    // const phaseDiv = await page.$("div[class='GetMnemonicCon']");
    // const phaseText = phaseDiv.textContent;
    // console.log("phaseText \n",phaseText);
    const phaseText = await page.$eval("div[class='GetMnemonicCon']", el => el.textContent);
    console.log("text: ", phaseText);
    savePhase(phaseText);
    // // 6. 点击已保存 助记词
    await page.waitForSelector("button[class='MuiButtonBase-root MuiButton-root MuiButton-contained borderRadius8 nextBtn MuiButton-containedPrimary']");
    await page.click("button[class='MuiButtonBase-root MuiButton-root MuiButton-contained borderRadius8 nextBtn MuiButton-containedPrimary']");
    // // 7. 输入对应的三个助记词
    // const items = await page.$$("div[class='wordItem']");
    // 先获取要点击的位置

    let indexes = [];
    const items = await page.$$("p[class='wordItemHeader']");
    console.log("items: ", items.length);
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let indexTx = await item.$$eval('span',
            node => node
                .map(n => n.innerText)
                .filter(t => t.length < 3));
        indexes.push(indexTx[0]);
        console.log('indexTx: ', indexTx[0]);
    }
    const phase = phaseText.trim().split(" ");
    console.log(phase);
    // 
    const boxes = await page.$$("div[class='wordItemBox']");
    console.log("boxes: ", boxes.length);
    for (let i = 0; i < boxes.length; i++) {
        const item = boxes[i];
        //*[@id="app"]/div/div/div[2]/div[1]/div/span[2]
        // document.querySelector("#app > div > div > div.VerificationMnemonicBox > div:nth-child(1) > div > span:nth-child(1)")
        const selectIndex = Number(indexes[i]);
        console.log(phase[selectIndex - 1]);
        const text = phase[selectIndex - 1];
        const textList = await item.$$eval('span',
            node => node
                .map(n => n.innerText));
        const index = textList.indexOf(text);
        console.log("index: ", index);
        const jsPath = "#app > div > div > div.VerificationMnemonicBox > div:nth-child(" + (i + 1).toString() + ")" + "> div > span:nth-child(" + (index + 1).toString() + ")";

        console.log("jsPath: ", jsPath);
        await page.click(jsPath);
    }
    // await sleep(10000);
    // // 8. 确认助记词
    await sleep(2000);
    await page.waitForSelector("span[class='MuiButton-label']");
    await page.click("span[class='MuiButton-label']");
    //  9. 进入钱包
    await sleep(5000);
    await page.waitForSelector("span[class='MuiButton-label']");
    await page.click("span[class='MuiButton-label']");
    // 10. 打印第一个钱包地址
    const addresses = _getAccountAddressesFromMnemonic(phaseText);
    console.log(addresses[0].address);

    const localStorage1 = await page.evaluate(() => Object.assign({}, window.localStorage));
    console.log("-----storage-----")
    console.log(localStorage1);
    console.log("-----------------")
}

function getPhases() {
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

function savePhase(phaseText = "") {
    const dataPath = getPath();
    // // parse JSON object
    const user_key_list = getPhases();
    // // print JSON object
    const length = user_key_list.length;
    console.log(length);
    user_key_list.push(phaseText);
    const data1 = JSON.stringify(user_key_list);
    // // write JSON string to a file
    fs.writeFileSync(dataPath, data1);
    console.log("JSON data is saved.");
}

function getPath() {
    return './phases.json';
}

function _getAccountAddressesFromMnemonic(seedPhrase = '', nums = 1) {
    const hdNode = utils.HDNode.fromMnemonic(seedPhrase);
    const basePath = "m/44'/60'/0'/0";
    let addresses = [];
    // const url = 'https://eth-mainnet-public.unifra.io/'
    // const customHttpProvider = new ethers.providers.JsonRpcProvider(url);
    for (let i = 0; i < nums; i++) {
        let { address, privateKey } = hdNode.derivePath(basePath + "/" + i);
        var wallet = new ethers.Wallet(privateKey);
        //   let walletSigner = wallet.connect(customHttpProvider)
        //   console.log(wallet.address);
        addresses.push(wallet);
    }
    return addresses;
}

async function sleep(d) {
    await new Promise((resolve) => setTimeout(resolve, d))
}



async function sleep(t) {
    await new Promise((resolve) => setTimeout(resolve, t))
}
