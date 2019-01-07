const fs = require("fs");
var userdata = require("./userdata.json");
const puppeteer = require('puppeteer');
const Excel = require("exceljs");
//const test_selector = `#user-history-table > table > tbody > tr:nth-child(23) > td:nth-child(7) > button:nth-child(5)`;

const test_selector = `#user-history-table > table > tbody > tr:nth-child(${userdata.mockTestNumber}) > td:nth-child(7) > button:nth-child(5)`;
 

(async () => {
    try{
        const browser = await puppeteer.launch({
            headless: true
        });
        const page = await browser.newPage();
        page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
      
        await page.goto('https://www.insightsias.com/user-login');
        await page.waitForSelector('#user_login');
        await page.$eval('input[name=mobile]', (el, value) => el.value = value, userdata.username);
        await page.$eval('input[name=password]', (el, value) => el.value = value, userdata.password);
        page.click('#login_btn');
        await page.waitForSelector('body > div.wrapper > aside > section > ul > li:nth-child(4) > a > span');
        page.click('body > div.wrapper > aside > section > ul > li:nth-child(4) > a > span');
      
      
        await page.waitForSelector(test_selector);
        await page.click(test_selector);
      
      
        await page.waitForSelector('#table_div > div.pagination.pagination-centered > ul > li:nth-child(3) > button');
        //await page.waitFor(5000);

        
        var buttonStatus = await page.evaluate(()=>{
            return document.querySelector('#table_div > div.pagination.pagination-centered > ul > li:nth-child(3) > button').getAttribute('disbaled');
         });

        await console.log(`${buttonStatus}` + ' - 1st check - outside the loop.');
        var counter = 1;
        await console.log(`We are on page ${counter}. Outside the buttonStatus Loop. Checking the button status now.` )

        await console.log(' ');
        await console.log('Entering the loop now.');
        var answers = [];

        while(1){
            //perform operations on the page. 
            for(var i=1; i<=20; i++){
                var set = await suckData(page, i);
                answers[i+(20*(counter-1))] = {Q: set.question, A:set.answer };
            }
            
            //Notify when last page is reached. 
            if(counter >= 5){
                await console.log(`Counter overflow: ${counter}, you must already be on page 5. \n Here's the Answers Object`);
                //break;
            }
            //Check for attribute of next button, and break loop when it turns grey (disabled)
            if(buttonStatus=='disabled'){
                break;
            }
            
            await console.log(`On page ${counter}. \n Clicking for next page. `);
            //CLick and Go to Next Page. 
            await page.click('#table_div > div.pagination.pagination-centered > ul > li:nth-child(3) > button');
            await page.waitForSelector('#table_div > div.pagination.pagination-centered > ul > li:nth-child(3) > button');
            await console.log("Waiting for the page to load...");
            //await page.waitFor(5000); -------
            await page.waitForSelector('#table_div > div.pagination.pagination-centered > ul > li:nth-child(3) > button');

            //count up after loading the new page. 
            counter = counter + 1; 
            await console.log(`Now on page ${counter}. Checking for button status`)

            //Check button status of the new page & update button status value. 
            buttonStatus = await page.evaluate((buttonStatus)=>{
                buttonStatus = document.querySelector('#table_div > div.pagination.pagination-centered > ul > li:nth-child(3) > button').getAttribute('disabled');
                return buttonStatus;
            },buttonStatus);
            await console.log(`This is the button Status: ${buttonStatus} \n - Updating button status variable for next loop. `);   
            
            //Loop ends here. 
            await console.log("Waiting for Next Loop");
            await console.log("");
            await console.log("");
        }
        await console.log(answers); //Log out answers on console. 
        await console.log(typeof(answers));
        
        await browser.close(); //End the chromium session

        //Write to spreadsheet. 
        var workbook = await new Excel.Workbook();
        await workbook.xlsx.readFile(userdata.outputFileName);
        var worksheet = await workbook.getWorksheet(1);

        for(i=1; i<=100; i++){
            var row = worksheet.getRow(i);
            row.getCell(1).value = answers[i].Q; // A5's value set to 5
            row.getCell(2).value = answers[i].A;
            row.commit();
        }
       
        await workbook.xlsx.writeFile(userdata.outputFileName); //Spreadsheet work ends here

    }catch(e){
        console.log("Puppet", e); //Output error. 
    }
  
})();

//Function - Scrape Data Operations. 
var suckData = async function(page, qNo) {

    // var qNo = qNi;
    await page.waitForSelector(`#table_div > table > tbody > tr:nth-child(${qNo}) > td:nth-child(2)`);

    //Get Question Number
    question = await page.evaluate((qNo)=>{
        return document.querySelector(`#table_div > table > tbody > tr:nth-child(${qNo}) > td:nth-child(1)`).innerText;
    }, qNo);
    answer = await page.evaluate((qNo)=>{
        return document.querySelector(`#table_div > table > tbody > tr:nth-child(${qNo}) > td:nth-child(2)`).innerText;
     }, qNo);

    return {question, answer}
};