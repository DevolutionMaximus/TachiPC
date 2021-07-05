import { ipcMain } from 'electron'
import axios from 'axios'

ipcMain.on('auth-login', async (event, username: string, password: string) => {
    let response = await axios.post('https://api.mangadex.org/auth/login', {
        'username': username,
        'password': password
    })
    if (response.status == 401) {
        ipcMain.
    }
})