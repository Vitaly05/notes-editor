const { CANCELLED } = require('dns');
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
    const mainDir = path.join(__dirname, './conspects')
    
    fs.readdir(mainDir, (err, files) => {
        if (err) throw err

        const mainCategory = new Category('Без категории')
        files.forEach(file => {

            if (file.includes('.consp')) {
                mainCategory.addConspect(new Conspect(file.replace('.consp', '')))
            } else {
                const category = new Category(file)
                
                const categoryDir = path.join(mainDir, `/${file}`)
                const files = fs.readdirSync(categoryDir)

                files.forEach(file => {
                    if (file.includes('.consp')) {
                        category.addConspect(new Conspect(file.replace('.consp', '')))
                    }
                })
                navigation.addCategory(category)
            }
        })

        navigation.addCategory(mainCategory)

        e.sender.send('navigationHtml', navigation.getHtml())
    })


})



