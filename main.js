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

ipcMain.handle('openConspect', (e, category, conspectName) => {
    fs.readFile(path.join(__dirname, 'conspects', category, `${conspectName}.consp`), (err, data) => {
        if (err) {
            console.error(err)
        } else {
            e.sender.send('setCanvasData', data.toString())
        }
    })
})

ipcMain.handle('saveConspect', (e, category, conspectName, fileData) => {
    fs.stat(path.join(__dirname, 'conspects', category), (err) => {
        if (err?.code == 'ENOENT') {
            fs.mkdirSync(path.join(__dirname, 'conspects', category))
        }
        fs.writeFile(path.join(__dirname, 'conspects', category,`${conspectName}.consp`), fileData, (err) => {
            if (err) console.error(err)
            else checkDir()
        })
    })
})

ipcMain.handle('addCategory', (e, category) => {
    fs.mkdir(path.join(__dirname, 'conspects', category), (err) => {
        if (err) console.error(err)
        else checkDir()
    })
})

ipcMain.handle('deleteCategory', (e, category) => {
    const _categoryPath = path.join(__dirname, 'conspects', category)

    const files = fs.readdirSync(_categoryPath)
    files.forEach(file => {
        fs.unlinkSync(path.join(_categoryPath, file))
    })
        

    fs.rmdir(_categoryPath, (err) => {
        if (err) console.error(err)
        else checkDir()
    })
})

ipcMain.handle('addConspect', (e, category, conspectName) => {
    fs.writeFile(path.join(__dirname, 'conspects', category, conspectName + '.consp'), '', (err) => {
        if (err) console.error(err)
        else checkDir()
    })
})

ipcMain.handle('deleteConspect', (e, category, conspectName) => {
    fs.unlink(path.join(__dirname, 'conspects', category, `${conspectName}.consp`), (err) => {
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
        return `<div id="categories">${this.getCategoriesHtml()}<div id="addCategoryPanel"><button id="addCategoryButton"><i class="fa fa-add"></i><p>Добавить<br />категорию</p></button></div></div>`
    }

    getCategoriesHtml() {
        let html = ''
        this.categories.forEach(category => {
            html += category.getHtml()
        })
        return html
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
        return `<div class="category"><div class="categoryTitle"><button class="categoryButton">${this.name}</button><button class="deleteCategoryButton" data-category="${this.name}"><i class="fa fa-trash"></i></button></div><div class="conspects">${this.getConspectsHtml()}<div class="addConspectPanel" data-category="${this.name}"><button class="addConspectButton" data-category="${this.name}"><i class="fa fa-add"></i><p>Новый конспект</p></button></div></div></div>`
    }
    getConspectsHtml() {
        let html = ''
        this.conspects.forEach(conspect => {
            html += conspect.getHtml(this.name)
        })
        return html
    }
}
class Conspect {
    constructor(name) {
        this.name = name
    }
    getHtml(category) {
        return `<div class="conspect"><button class="deleteConspectButton" data-name="${this.name}" data-category="${category}"><i class="fa fa-trash"></i></button><button class="conspectButton" data-name="${this.name}" data-category="${category}">${this.name}</button></div>`
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