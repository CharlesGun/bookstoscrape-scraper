const excel = require("exceljs")

module.exports = {
    makeExcel: async (data) => {
        try {
            let workBook = new excel.Workbook()

            const sheet = workBook.addWorksheet("books")
            sheet.columns = [
                {header:"URL",key:"url", width:50},
                {header:"ImageUrl",key:"image", width:50},
                {header:"Title",key:"title", width:25},
                {header:"Rating",key:"rating"},
                {header:"Stock",key:"stock"},
                {header:"Price",key:"price"}
            ]

            await data.map((value)=>{
                sheet.addRow({url: value.url, image: value.image, title: value.title, rating: value.rating, stock: value.stock, price: value.price})
            })

            await workBook.xlsx.writeFile("BookScrapValue.xlsx")
            console.log("Write Data Success");
        } catch (error) {
            console.log(error);
        }

    }
}