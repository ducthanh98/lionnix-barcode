const { app, BrowserWindow,ipcMain,dialog } = require('electron')


function createWindow () {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 500,
        height: 500,
	icon:'./assets/logo.png',
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.loadFile('barcode.html')

    // win.webContents.openDevTools()

    ipcMain.on('print', (event, arg) => {
        win.webContents.print({silent:true},((success, failureReason) => {
            if(!success) {
                return dialog.showMessageBox({type: 'error', buttons: ['OK'], title: 'Error', message: failureReason});
            }
        }))
    });
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})
