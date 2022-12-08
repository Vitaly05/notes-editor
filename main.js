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

            fs.writeFile(result.filePath, fileContents, (err) => {
                console.error(err)
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
                    console.error(err)
                } else {
                    e.sender.send('setCanvasData', data.toString())
                }
            })

        }
    }).catch(err => {
        console.log(err)
    })
})

ipcMain.handle('openConspect', (e, filePath) => {
    fs.readFile(path.join(__dirname, `${filePath}.consp`), (err, data) => {
        if (err) {
            console.error(err)
        } else {
            e.sender.send('setCanvasData', data.toString())
        }
    })
})

ipcMain.handle('saveConspect', (e, filePath, fileData) => {
    fs.writeFile(path.join(__dirname, `${filePath}.consp`), fileData, (err) => {
        if (err) console.error(err)
    })
})

ipcMain.handle('addCategory', (e, categoryName) => {
    fs.mkdir(path.join(__dirname, '/conspects/' + categoryName), (err) => {
        if (err) console.error(err)
        else checkDir()
    })
})

ipcMain.handle('deleteCategory', (e, categoryPath) => {
    fs.rmdir(path.join(__dirname, categoryPath), (err) => {
        if (err) console.error(err)
        else checkDir()
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
        return `<div id="categories">${this.getCategoriesHtml('/conspects')}<div id="addCategoryPanel"><button class="addButton" id="addCategoryButton"><i class="fa fa-add"></i><p>Добавить<br />категорию</p></button></div></div>`
    }

    getCategoriesHtml(path) {
        let html = ''
        this.categories.forEach(category => {
            html += category.getHtml(path)
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
    getHtml(path) {
        return `<div class="category"><div class="categoryTitle"><button class="categoryButton">${this.name}</button><button class="deleteCategoryButton" data-categoryPath="${path}/${this.name}"><i class="fa fa-trash"></i></button></div><div class="conspects">${this.getConspectsHtml(`${path}/${this.name}`)}<div id="addPanel"><button class="addButton" id="addConspectButton"><i class="fa fa-add"></i><p>Новый конспект</p></button></div></div></div>`
    }
    getConspectsHtml(path) {
        let html = ''
        this.conspects.forEach(conspect => {
            html += conspect.getHtml(path)
        })
        return html
    }
}
class Conspect {
    constructor(name) {
        this.name = name
    }
    getHtml(path) {
        return `<div class="conspect"><button class="conspectButton" data-filePath="${path}/${this.name}">${this.name}</button></div>`
    }
}



ipcMain.handle('checkDir', (e) => {
    checkDir()
})

function checkDir() {
    const navigation = new NavigationPanel()
    const mainDir = path.join(__dirname, '/conspects')
    
    fs.readdir(mainDir, (err, files) => {
        if (err) throw err

        files.forEach(file => {

            if (!file.includes('.consp')) {
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


        mainWindow.webContents.send('navigationHtml', navigation.getHtml())
    })
}