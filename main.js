const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs')
const path = require('path')

let mainWindow

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })


    mainWindow.loadFile('index.html')
    mainWindow.webContents.openDevTools()
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});



ipcMain.handle('saveFileAs', (e, fileContents) => {
    dialog.showSaveDialog(mainWindow, {
        title: 'Сохранить как',
        filters: [
            { name: 'Конспект', extensions: ['consp'] }
        ]
    }).then(result => {
        if (!result.canceled) {

            fs.writeFile(result.filePath, fileContents, function(err) {
                console.log(err)
            })

        }
    }).catch(err => {
        console.log(err)
    })
})

ipcMain.handle('openFile', (e) => {
    dialog.showOpenDialog(mainWindow, {
        title: 'Открытие документа',
        filters: [
            { name: 'Конспект', extensions: ['consp'] }
        ],
        properties: [ 'openFile' ]
    }).then(result => {
        if (!result.canceled) {

            fs.readFile(result.filePaths[0], {}, (err, data) => {
                if (err) {
                    console.log(err)
                } else {
                    e.sender.send('fileOpen', data.toString())
                }
            })

        }
    }).catch(err => {
        console.log(err)
    })
})




class NavigationPanel {
    constructor() {
        this.categories = []
    }

    addCategory(category) {
        this.categories.push(category)
    }

    getHtml() {
        return `<ul id="categories">${this.getCategoriesHtml()}</ul>`
    }

    getCategoriesHtml() {
        let html = ''
        this.categories.forEach(category => {
            html += category.getHtml()
        })
        return html
    }

    logg() {
        console.log(this.categories)
    }
}
class Category {
    constructor(name) {
        this.name = name
        this.conspects = []
    }
    addConspect(conspect) {
        this.conspects.push(conspect)
    }
    getHtml() {
        return `<li class="category">${this.name}<ul class="conspects">${this.getConspectsHtml()}</ul></li>`
    }
    getConspectsHtml() {
        let html = ''
        this.conspects.forEach(conspect => {
            html += conspect.getHtml()
        })
        return html
    }
}
class Conspect {
    constructor(name) {
        this.name = name
    }
    getHtml() {
        return `<li class="conspect">${this.name}</li>`
    }
}



ipcMain.handle('checkDir', (e) => {

    const navigation = new NavigationPanel()

    const category1 = new Category('category1')
    category1.addConspect(new Conspect('conspect1-1'))
    category1.addConspect(new Conspect('conspect1-2'))
    navigation.addCategory(category1)

    const category2 = new Category('category2')
    category2.addConspect(new Conspect('conspect2-1'))
    category2.addConspect(new Conspect('conspect2-2'))
    navigation.addCategory(category2)

    e.sender.send('navigationHtml', navigation.getHtml())

    
    fs.readdir(path.join(__dirname, './conspects'), (err, files) => {
        if (err) throw err

        
    })


})



