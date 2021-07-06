import { ipcMain } from 'electron'
import axios from 'axios'
import { AxiosError } from 'axios'

//TODO: logging

type AuthLoginResponse = {
    result: string,
    token: {
        session: string,
        refresh: string
    }
}

type AuthCheckResponse = {
    result: string,
    isAuthenticated: boolean
    roles: Array<string>,
    permissions: Array<string>
}

type MangadexError = {
    result: string,
    errors: Array<{
        id: string,
        status: number,
        title: string,
        detail: string
    }>
}

const mangadexInstance = axios.create({
    baseURL: 'https://api.mangadex.org/',

})

mangadexInstance.interceptors.response.use((response) => response, (error: unknown|AxiosError) => {
    if (axios.isAxiosError(error)) {
        if (error.response.data && error.response.data.errors) {
            let replyObject = {
                status: error.response.status,
                details: error.response.data.errors[0].details
            }
            ipcMain.
            ('mangadex-error', replyObject)
        }
        else if (error.response) {
            let replyObject = {
                status: error.response.status,
                details: 'Unknown Error'
            }
            ('mangadex-error', replyObject)
        }
    }
    else {
        let replyObject = {
            status: -1,
            details: 'Unknown Error'
        }
        console.error(error)
        ('mangadex-error', replyObject)
    }
})

ipcMain.on('auth-login', async (event, username: string, password: string) => {
    try {
        let response = await axios.post('/auth/login', {
                'username': username,
                'password': password
            })
        let data: AuthLoginResponse = response.data
        mangadexInstance.defaults.headers.common['Authorization'] = `Bearer: ${data.token.session}`
        event.reply('mangadex-auth-login-success', '')
    }
    catch (error: unknown|AxiosError) {
        if (axios.isAxiosError(error)) {
            if (error.response.data && error.response.data.errors) {
                let replyObject = {
                    status: error.response.status,
                    details: error.response.data.errors[0].details
                }
                event.reply('mangadex-error', replyObject)
            }
            else if (error.response) {
                let replyObject = {
                    status: error.response.status,
                    details: 'Unknown Error'
                }
                event.reply('mangadex-error', replyObject)
            }
        }
        else {
            let replyObject = {
                status: -1,
                details: 'Unknown Error'
            }
            console.error(error)
            event.reply('mangadex-error', replyObject)
        }
    }
})

ipcMain.on('auth-check', async (event) => {
    try {
        let response = await axios.get('/auth/check')
        let data: AuthCheckResponse = response.data
        event.reply('mangadex-auth-check-success', data.isAuthenticated)
    }
    catch (error: unknown|AxiosError) {
        if (axios.isAxiosError(error)) {
            if (error.response.data && error.response.data.errors) {
                let replyObject = {
                    status: error.response.status,
                    details: error.response.data.errors[0].details
                }
                event.reply('mangadex-error', replyObject)
            }
            else if (error.response) {
                let replyObject = {
                    status: error.response.status,
                    details: 'Unknown Error'
                }
                event.reply('mangadex-error', replyObject)
            }
        }
        else {
            let replyObject = {
                status: -1,
                details: 'Unknown Error'
            }
            console.error(error)
            event.reply('mangadex-error', replyObject)
        }
    }
})

ipcMain.on('auth-logout', async(event) => {
    try {
        let response = await axios.post('/auth/logout')
    }
    catch (error: unknown|AxiosError) {
        if (axios.isAxiosError(error)) {
            if (error.response.data && error.response.data.errors) {
                let replyObject = {
                    status: error.response.status,
                    details: error.response.data.errors[0].details
                }
                event.reply('mangadex-error', replyObject)
            }
            else if (error.response) {
                let replyObject = {
                    status: error.response.status,
                    details: 'Unknown Error'
                }
                event.reply('mangadex-error', replyObject)
            }
        }
        else {
            let replyObject = {
                status: -1,
                details: 'Unknown Error'
            }
            console.error(error)
            event.reply('mangadex-error', replyObject)
        }
    }
})