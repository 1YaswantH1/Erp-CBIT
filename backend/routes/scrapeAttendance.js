const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function scrapeAttendance(username, password) {
  const options = new chrome.Options();

  options.addArguments(
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--window-size=1920,1080",
  );

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get("https://erp.cbit.org.in/");

    const wait = driver.wait.bind(driver);

    const usernameField = await wait(
      until.elementLocated(By.id("txtUserName")),
      10000,
    );

    await usernameField.sendKeys(username);
    await driver.findElement(By.id("btnNext")).click();

    const passwordField = await wait(
      until.elementLocated(By.id("txtPassword")),
      10000,
    );

    await passwordField.sendKeys(password);
    await driver.findElement(By.id("btnSubmit")).click();

    // dashboard
    const dashboard = await wait(
      until.elementLocated(By.id("ctl00_cpStud_lnkStudentMain")),
      10000,
    );

    await dashboard.click();

    // ⭐ GET STUDENT NAME
    const nameElement = await wait(
      until.elementLocated(By.id("ctl00_cpHeader_ucStud_lblStudentName")),
      10000,
    );

    const studentName = await nameElement.getText();

    const table = await wait(
      until.elementLocated(By.id("ctl00_cpStud_grdSubject")),
      10000,
    );

    const rows = await table.findElements(By.tagName("tr"));

    let attendance = [];

    for (let row of rows) {
      const cols = await row.findElements(By.tagName("td"));
      let data = [];

      for (let col of cols) {
        data.push(await col.getText());
      }

      if (data.length > 0) attendance.push(data);
    }

    // return both
    return {
      studentName,
      attendance,
    };
  } finally {
    await driver.quit();
  }
}

module.exports = scrapeAttendance;
