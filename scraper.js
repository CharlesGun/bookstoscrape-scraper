const puppeteer = require("puppeteer")
const excel = require("./excel")

const scrape = async () => {
    let data = []
    // Start a Puppeteer session with:
    // - headless = "new" => the browser gonna work in background
    // - headless = false => the browser gonna be visible and you can see all actions
    // - no default viewport (`defaultViewport: null` - website page will be in full width and height)
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    // Open a new page
    const page = await browser.newPage();

    // On this new page:
    // - open the "http://books.toscrape.com/" website
    // - wait until the dom content is loaded (HTML is ready)
    await page.goto("https://books.toscrape.com/", {
        waitUntil: "domcontentloaded",
    });
    let stop = false
    while (!stop) {
        // find all elements that have given selectors
        const targets = await page.$$("li.col-xs-6.col-sm-4.col-md-3.col-lg-3")
        for (const target of targets) {
            try {
                //book url
                // get attribute href from tag a in parent tag div class=image_container
                const bookUrl = await target.$eval("div.image_container > a", el => el.getAttribute("href"))
                // some url in bookUrl will have catalogue and some will not, so lets delete it if it exists
                const urlValue = "books.toscrape.com/catalogue/" + bookUrl.replace("catalogue/","")
                //book title
                // get attribute title form tag a in parent tag h3
                const title = await target.$eval("h3 > a", el => el.getAttribute("title"))
                //book price
                // get text that contained in tag p with class=price_color in parent tag div with class=product_price
                const price = await target.$eval("div.product_price > p.price_color", el => el.innerHTML)
                //book rating
                // get attribute class from tag p in parent tag article class=product_pod
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
                // get attribute src in tag img in parent tag a in parent tag div class=imgae_container
                const image = await target.$eval("div.image_container > a > img", el => "books.toscrape.com/" + el.getAttribute("src"))

                // open new page for detail of book
                let newPage = await browser.newPage()
                await newPage.goto("http://" + urlValue, {
                    waitUntil: "domcontentloaded"
                })

                //book stock
                // get text that contained in tag p with class=instock.availability
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
        // find is there next page in this page
        // if yes click it
        // if no just stop the loop
        let pagination = await page.$("li.next", el => !!el)
        if(pagination==null){
            stop = true
        } else {
            await page.click("ul.pager > li.next > a")
        } 
    }
    // close browser
    browser.close();

    // create excel
    await excel.makeExcel(data);
};

// Start the scraping
scrape();