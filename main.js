const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron');
const fs = require('fs')
const path = require('path')

let mainWindow

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 1000,
        minWidth: 1100,
        minHeight: 700,
        
        title: 'Электнонные конспекты',

        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    mainWindow.setMenuBarVisibility(false)
    mainWindow.setIcon(path.join(__dirname, 'res', 'icon.ico'))

    mainWindow.loadFile('index.html')
    // mainWindow.webContents.openDevTools()
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })

    setShortcuts()
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
            { name: 'Конспект', extensions: ['consp'] },
            { name: 'Веб-страница', extensions: ['html'] }
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
                    e.sender.send('setNewFileData', data.toString())
                }
            })

        }
    }).catch(err => {
        console.log(err)
    })
})

ipcMain.handle('openImage', (e) => {
    dialog.showOpenDialog(mainWindow, {
        title: 'Выбор изображения',
        filters: [
            { name: 'Images', extensions: ['jpg', 'png'] }
        ],
        properties: ['openFile']
    }).then(result => {
        if (!result.canceled) {
            e.sender.send('insertImage', result.filePaths[0])
        }
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

ipcMain.handle('updateConspect', (e, category, conspectName, fileData) => {
    fs.writeFile(path.join(__dirname, 'conspects', category,`${conspectName}.consp`), fileData, (err) => {
        if (err) console.error(err)
    })
})

ipcMain.handle('addCategory', (e, category) => {
    fs.mkdir(path.join(__dirname, 'conspects', category), (err) => {
        if (err) {
            if (err.code == 'EEXIST') {
                dialog.showMessageBox(mainWindow, {
                    type: 'error',
                    title: 'Создание категории',
                    message: 'Такая категория уже существует'
                })
            }
        } else checkDir()
    })
})

ipcMain.handle('deleteCategory', (e, category) => {
    dialog.showMessageBox(mainWindow, {
        type: 'question',
        title: 'Удаление категории',
        message: `Вы уверены, что хотите удалить категорию "${category}"?`,
        buttons: [ 'Yes', 'Cancel'],
        cancelId: 1
    }).then(result => {
        if (result.response == 0) {
            const _categoryPath = path.join(__dirname, 'conspects', category)

            const files = fs.readdirSync(_categoryPath)
            files.forEach(file => {
                fs.unlinkSync(path.join(_categoryPath, file))
            })
                

            fs.rmdir(_categoryPath, (err) => {
                if (err) console.error(err)
                else {
                    checkDir()
                    e.sender.send('categoryDeleted', category)
                }
            })
        }
    })
})

ipcMain.handle('addConspect', (e, category, conspectName) => {
    fs.writeFile(path.join(__dirname, 'conspects', category, conspectName + '.consp'), '', (err) => {
        if (err) console.error(err)
        else checkDir()
    })
})

ipcMain.handle('deleteConspect', (e, category, conspectName) => {
    dialog.showMessageBox(mainWindow, {
        type: 'question',
        title: 'Удаление конспекта',
        message: `Вы уверены, что хотите удалить конспект "${conspectName}" из категории "${category}"?`,
        buttons: [ 'Yes', 'Cancel'],
        cancelId: 1
    }).then(result => {
        if (result.response == 0) {
            fs.unlink(path.join(__dirname, 'conspects', category, `${conspectName}.consp`), (err) => {
                if (err) console.error(err)
                else {
                    checkDir()
                    e.sender.send('conspectDeleted', conspectName)
                }
            })
        }
    })
})


function setShortcuts() {
    globalShortcut.register('CommandOrControl+L', () => {
        mainWindow.webContents.send('justifyLeft')
    })
    globalShortcut.register('CommandOrControl+E', () => {
        mainWindow.webContents.send('justifyCenter')
    })
    globalShortcut.register('CommandOrControl+R', () => {
        mainWindow.webContents.send('justifyRight')
    })
    globalShortcut.register('CommandOrControl+S', () => {
        mainWindow.webContents.send('saveConspect')
    })
}




class NavigationPanel {
    constructor() {
        this.categories = []
    }

    addCategory(category) {
        this.categories.push(category)
    }

    getHtml() {
        return `
        <div id="categories">
            ${this.getCategoriesHtml()}
            <div id="addCategoryPanel">
                <button id="addCategoryButton">
                    <i class="fa fa-add"></i>
                    <span>Добавить категорию</span>
                </button>
            </div>
        </div>
        `
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
        return `
        <div class="category">
            <div class="categoryTitle">
                <span class="categoryName">
                    ${this.name}
                </span>
                <button class="deleteCategoryButton"
                    data-category="${this.name}">
                    <img class="deleteIcon" src="./res/deleteIcon.png" />
                </button>
            </div>
            <div class="conspects">
                ${this.getConspectsHtml()}
                <div class="addConspectPanel"
                    data-category="${this.name}">
                    <button class="addConspectButton"
                        data-category="${this.name}">
                        <i class="fa fa-add"></i>
                        <span>Новый конспект</span>
                    </button>
                </div>
            </div>
        </div>
        `
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
        return `
        <div class="conspect">
            <button class="conspectButton"
                data-name="${this.name}"
                data-category="${category}">
                ${this.name}
            </button>
            <button class="deleteConspectButton"
                data-name="${this.name}"
                data-category="${category}">
                <img class="deleteIcon" src="./res/deleteIcon.png" />
            </button>
        </div>
        `
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