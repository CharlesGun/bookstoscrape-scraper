const puppeteer = require("puppeteer")
const excel = require("./excel")

const scrape = async () => {
    let data = []
    // Start a Puppeteer session with:
    // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
    // - no default viewport (`defaultViewport: null` - website page will be in full width and height)
    const browser = await puppeteer.launch({
        headless: "new",
        // headless: false,
        defaultViewport: null,
    });

    // Open a new page
    const page = await browser.newPage();

    // On this new page:
    // - open the "http://quotes.toscrape.com/" website
    // - wait until the dom content is loaded (HTML is ready)
    await page.goto("https://books.toscrape.com/", {
        waitUntil: "networkidle2",
    });
    let stop = false
    while (!stop) {
        const targets = await page.$$("li.col-xs-6.col-sm-4.col-md-3.col-lg-3")
        for (const target of targets) {
            try {
                //book url
                const bookUrl = await target.$eval("div.image_container > a", el => el.getAttribute("href"))
                const urlValue = "books.toscrape.com/catalogue/" + bookUrl.replace("catalogue/","")
                //book title
                const title = await target.$eval("h3 a", el => el.getAttribute("title"))
                //book price
                const price = await target.$eval("div.product_price > p.price_color", el => el.innerHTML)
                //book rating
                const rating = await target.$eval("article.product_pod > p", el => el.getAttribute("class"))
                const ratingSplit = rating.split(" ")[1]
                let ratingValue = 0;
                switch (ratingSplit) {
                    case "One":
                        ratingValue = 1;
                        break;
                    case "Two":
                        ratingValue = 2;
                        break;
                    case "Three":
                        ratingValue = 3;
                        break;
                    case "Four":
                        ratingValue = 4;
                        break;
                    case "Five":
                        ratingValue = 5;
                        break;
                    default:
                        ratingValue = 0;
                        break;
                }

                //book imageUrl
                const image = await target.$eval("div.image_container > a > img", el => "books.toscrape.com/" + el.getAttribute("src"))

                let newPage = await browser.newPage()
                await newPage.goto("http://" + urlValue, {
                    waitUntil: "domcontentloaded"
                })

                //book stock
                const stock = await newPage.$eval("p.instock.availability", el => el.textContent)
                const stockErase = stock.replace("(", "")
                const stockSplit = stockErase.replaceAll("\n", "")
                const fixStringStock = stockSplit.split(" ")[18]
                const stockValue = parseInt(fixStringStock)
                await newPage.close()

                let bookData = {
                    url: urlValue,
                    title: title,
                    price: price,
                    rating: ratingValue,
                    image: image,
                    stock: stockValue
                }

                data.push(bookData)
            } catch (err) {
                console.log(err)
            }
        }
        let pagination = await page.$("li.next", el => !!el)
        if(pagination==null){
            stop = true
        } else {
            await page.click("ul.pager > li.next > a")
        } 
    }
    browser.close();
    await excel.makeExcel(data);
};

// Start the scraping
scrape();