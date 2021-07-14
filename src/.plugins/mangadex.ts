import { ipcMain } from 'electron'
import axios, { AxiosInstance, AxiosError } from 'axios'
import Store from '../config'
import path from 'path'
import Bottleneck from 'bottleneck'
import { v4 as uuid } from 'uuid'

//TODO: logging

type PublicationDemographic = 'shounen' | 'shoujo' | 'josei' | 'seinen' | 'none'

type Status = 'ongoing' | 'completed' | 'hiatus' | 'cancelled'

type ContentRating = 'safe' | 'suggestive' | 'erotica' | 'pornographic' | 'none'

type TagsMode = 'AND' | 'OR'

type ResultUnion = 'ok' | 'error'

type OrderUnion = 'asc' | 'desc'

type TypeUnion = 'manga' | 'chapter' | 'cover_art' | 'author' | 'artist' | 'scanlation_group' | 'tag' | 'user' | 'custom_list'

type Visibility = 'private' | 'public'

type KnownOriginalLanguages = 'ja' | 'ko' | 'zh'

type AllAttributes = AuthorAttributes | MangaAttributes | CoverAttributes | ScanlationGroupAttributes | CustomListAttributes | UserAttributes | ChapterAttributes | TagAttributes

type ResponseObject<T, A extends TypeUnion> = {
    id: string,
    type: A,
    attributes: T
}

type PartialResponseObject<T extends ResponseObject<AllAttributes, TypeUnion> = undefined> = T extends undefined ? {
    id: string,
    type: TypeUnion
} : {
    id: T['id'],
    type: T['type'],
    attributes?: T['attributes']
}

type Response<T extends ResponseObject<AllAttributes, TypeUnion>, R extends ResponseObject<AllAttributes, TypeUnion> = undefined> = {
    result: ResultUnion,
    data: T
    relationships: Array<PartialResponseObject<R>>
}

type AuthLoginResponse = {
    result: ResultUnion,
    token: {
        session: string,
        refresh: string
    }
}

type AuthCheckResponse = {
    result: ResultUnion,
    isAuthenticated: boolean
    roles: Array<string>,
    permissions: Array<string>
}

type AuthRefreshResponse = {
    result: ResultUnion,
    token: {
        session: string,
        refresh: string
    },
    message: string
}

type LocalizedString = {
    [locale: string]: string
}

type TagAttributes = {
    name: LocalizedString,
    description: LocalizedString,
    group: string,
    version: number
}

type Tag = ResponseObject<TagAttributes, 'tag'>

type MangaAttributes = {
    title: LocalizedString,
    altTitles: Array<LocalizedString>,
    description: LocalizedString,
    isLocked: boolean,
    links: {
        [link: string]: string
    },
    originalLanguage: KnownOriginalLanguages,
    lastVolume: string | null,
    lastChapter: string | null,
    publicationDemographic: PublicationDemographic | null,
    status: Status | null,
    year: number | null,
    contentRating: ContentRating | null,
    tags: Array<Tag>,
    version: number,
    createdAt: string,
    updatedAt: string
}

type Manga = ResponseObject<MangaAttributes, 'manga'>

type CoverAttributes = {
    volume: string | null,
    fileName: string,
    description: string | null,
    version: number,
    createdAt: string,
    updatedAt: string
}

type Cover = ResponseObject<CoverAttributes, 'cover_art'>

type ChapterAttributes = {
    title: string,
    volume: string | null,
    chapter: string | null,
    translatedLanguage: string,
    hash: string,
    data: Array<string>,
    dataSaver: Array<string>,
    uploader: string,
    version: number,
    createdAt: string,
    updatedAt: string,
    publishAt: string
}

type Chapter = ResponseObject<ChapterAttributes, 'chapter'>

type UserAttributes = {
    username: string,
    version: number
}

type User = ResponseObject<UserAttributes, 'user'>

type ScanlationGroupAttributes = {
    name: string,
    leader: User,
    locked: boolean,
    version: number,
    createdAt: string,
    updatedAt: string
}

type ScanlationGroup = ResponseObject<ScanlationGroupAttributes, 'scanlation_group'>

type AuthorAttributes = {
    name: string,
    imageUrl: string,
    biography: {
        [entry: string]: string
    },
    version: number,
    createdAt: string,
    updatedAt: string
}

type Author = ResponseObject<AuthorAttributes, 'author' | 'artist'>

type CustomListAttributes = {
    name: string,
    visibility: Visibility,
    owner: User,
    version: number
}

type CustomList = ResponseObject<CustomListAttributes, 'custom_list'>

type TagResponse = Array<Response<Tag>>

type MangaResponse = Response<Manga, Author | Cover>

type MangaListResponse = {
    results: Array<MangaResponse>,
    limit: number,
    offset: number,
    total: number
}

type CoverResponse = Response<Cover, Manga | User>

type CoverListResponse = {
    results: Array<CoverResponse>,
    limit: number,
    offset: number,
    total: number
}

type ChapterResponse = Response<Chapter, ScanlationGroup | Manga | User>

type ChapterListResponse = {
    results: Array<ChapterResponse>,
    limit: number,
    offset: number,
    total: number
}

type ScanlationGroupResponse = Response<ScanlationGroup, User>

type UserResponse = Response<User>

type AuthorResponse = Response<Author, Manga>

//needs auth to view relationships
type CustomListResponse = Response<CustomList>

const isResponseObject = <T extends ResponseObject<AllAttributes, TypeUnion>>(item: ResponseObject<AllAttributes, TypeUnion>, type: TypeUnion): item is T => {
    return (item.type === type)
}

const isPartialResponseObject = <T extends ResponseObject<AllAttributes, TypeUnion>>(item: PartialResponseObject<ResponseObject<AllAttributes, TypeUnion>>, type: TypeUnion): item is PartialResponseObject<T> => {
    return (item.type === type)
}

type MangadexError = {
    result: ResultUnion,
    errors: Array<{
        id: string,
        status: number,
        title: string,
        detail: string
    }>
}

type MangaListIncludes = Extract<TypeUnion, 'author' | 'cover_art' | 'artist'>

type MangaListOptions = {
    limit?: number,
    offset?: number, 
    title?: string,
    authors?: Array<string>,
    artists?: Array<string>,
    year?: number,
    includedTags?: Array<string>,
    includedTagsMode?: TagsMode,
    excludedTags?: Array<string>,
    status?: Array<Status>,
    originalLanguage?: KnownOriginalLanguages,
    publicationDemographic?: Array<PublicationDemographic>,
    ids?: Array<string>,
    contentRating?: Array<ContentRating>,
    createdAtSince?: string,
    updatedAtSince?: string,
    order?: {
        createdAt?: OrderUnion,
        updatedAt?: OrderUnion
    },
    includes?: Array<MangaListIncludes>
}

type ChapterListIncludes = Extract<TypeUnion, 'scanlation_group' | 'manga' | 'user'>

type ChapterListOptions = {
    limit?: number,
    offset?: number,
    ids?: Array<string>,
    title?: string,
    groups?: Array<string>,
    uploader?: string,
    manga?: string,
    volume?: string | Array<string>,
    chapter?: string | Array<string>,
    translatedLanguage?: Array<string>,
    createdAtSince?: string,
    updatedAtSince?: string,
    publishAtSince?: string,
    order?: {
        createdAt?: OrderUnion,
        updatedAt?: OrderUnion,
        publishAt?: OrderUnion,
        volume?: OrderUnion,
        chapter?: OrderUnion
    },
    includes?: Array<ChapterListIncludes>
}

type TagEntry = {
    id: string,
    name: string,
    group: string
}

type ChapterCache = {
    [id: string]: {
        data: Array<string>,
        dataSaver: Array<string>,
        hash: string
    }
}

const mangadexConfigDefaults = {
    refreshToken: '',
    username: '',
}

const mangadexUserConfigDefaults = {
    contentRating: ['safe', 'suggestive'] as Array<ContentRating>,
    locale: 'en',
    mangaLimit: 30,
    chapterLimit: 100,
}

const mangadexStore = new Store(path.join('extensions', 'mangadex', 'config'), mangadexConfigDefaults)
const mangadexUserStore = new Store(path.join('extensions', 'mangadex', 'userConfig'), mangadexUserConfigDefaults)
const mangadexInstance = axios.create({
    baseURL: 'https://api.mangadex.org/',
})
const globalLimiter = new Bottleneck({
    maxConcurrent: 5,
    minTime: 200
})
let tagList: Array<TagEntry>
let isAuthenticated = false
let sessionToken = ''
let initErrors: Array<{ status: number, details: string }>
let chapterCache: ChapterCache

const init = async () => {
    const token = mangadexStore.get('refreshToken')
    if (token && token.length > 0) {
        try {
            await refreshSessionToken()
            isAuthenticated = true
        }
        catch (error: unknown|AxiosError) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    if (error.response.status == 401 || error.response.status == 403) {
                        isAuthenticated = false
                    }
                    else {
                        initErrors.push({
                            status: error.response.status,
                            details: 'Unable to contact authentication servers. Login required'
                        })
                        isAuthenticated = false
                    }
                }
                else {
                    initErrors.push({
                        status: -1,
                        details: 'Unknown Axios error during initialization'
                    })
                    console.error(error)
                    isAuthenticated = false
                }
            }
            else {
                initErrors.push({
                    status: -1,
                    details: 'Unknown error during initialization'
                })
                console.error(error)
                isAuthenticated = false
            }
        }
    }
    else {
        isAuthenticated = false
    }
    try {
        await initTags()
    }
    catch (error: unknown|AxiosError) {
        if(axios.isAxiosError(error)) {
            if(error.response) {
                initErrors.push({
                    status: error.response.status,
                    details: 'Unable to get taglist'
                })
            }
            else {
                initErrors.push({
                    status: -1,
                    details: 'Unknown Axios error during initialization'
                })
                console.error(error)
            }
        }
        else {
            initErrors.push({
                status: -1,
                details: 'Unknown error during initialization'
            })
            console.error(error)
        }
    }
    
    
}

const handleError = (event: Electron.IpcMainEvent, error: unknown|AxiosError) => {
    if (axios.isAxiosError(error)) {
        if (error.response.data && error.response.data.errors) {
            let replyObject = {
                status: error.response.status,
                details: error.response.data.errors[0].details
            }
            event.reply('error', 'MangaDex', replyObject)
        }
        else if (error.response) {
            let replyObject = {
                status: error.response.status,
                details: 'Unknown Error'
            }
            event.reply('error', 'MangaDex', replyObject)
        }
        else {
            let replyObject = {
                status: -1,
                details: 'Unknown Axios Error'
            }
            console.error(error)
            event.reply('error', 'MangaDex', replyObject)
        }
    }
    else {
        let replyObject = {
            status: -1,
            details: 'Unknown Error'
        }
        console.error(error)
        event.reply('error', 'MangaDex', replyObject)
    }
}

const login = async (username: string, password: string) => {
    let response = await globalLimiter.schedule(() => axios.post('/auth/login', {
            'username': username,
            'password': password
        }))
    let data: AuthLoginResponse = response.data
    sessionToken = data.token.session
    mangadexStore.set('refreshToken', data.token.refresh)
    mangadexInstance.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`
}

const checkAuthentication = async () => {
    let response = await globalLimiter.schedule(() => axios.get('/auth/check'))
    let data: AuthCheckResponse = response.data
    return data.isAuthenticated
}

const logout = async () => {
    let response = await globalLimiter.schedule(() => axios.post('/auth/logout'))
}

const refreshSessionToken = async () => {
    let response = await globalLimiter.schedule(() => axios.post('/auth/refresh', {
        'token': mangadexStore.get('refreshToken')
    }))
    let data: AuthRefreshResponse = response.data
    sessionToken = data.token.session
    mangadexStore.set('refreshToken', data.token.refresh)
    mangadexInstance.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`
}

const initTags = async () => {
    let response = await globalLimiter.schedule(() => axios.get('/manga/tag'))
    let data: TagResponse = response.data
    for (let i = 0; i < data.length; i++) {
        tagList.push({
            id: data[i].data.id,
            name: data[i].data.attributes.name.en,
            group: data[i].data.attributes.group
        })
    }
}

const getLoginStatus = () => {
    return isAuthenticated
}

const getMangaList = async (options: MangaListOptions = {contentRating: mangadexUserStore.get('contentRating'), limit: mangadexUserStore.get('mangaLimit')}) => {
    let response = await globalLimiter.schedule(() => axios.get('/manga', {params: options}))
    let data: MangaListResponse = response.data
    let reply: Array<{
        id: string,
        name: string,
        cover_art: string,
        description: string,
        publicationDemographic: PublicationDemographic,
        contentRating: ContentRating,
        tags: Array<Tag>,
        originalLanguage: KnownOriginalLanguages,
        status: Status
    }>
    for (let i = 0; i < data.results.length; i++) {
        reply.push({
            id: data.results[i].data.id,
            name: data.results[i].data.attributes.title.en,
            cover_art: data.results[i].relationships.filter((value: PartialResponseObject<ResponseObject<AllAttributes, TypeUnion>>): value is Cover => isPartialResponseObject<Cover>(value, 'cover_art'))[0].attributes.fileName,
            description: data.results[i].data.attributes.description.en ? data.results[i].data.attributes.description.en : '',
            publicationDemographic: data.results[i].data.attributes.publicationDemographic,
            contentRating: data.results[i].data.attributes.contentRating,
            tags: data.results[i].data.attributes.tags,
            originalLanguage: data.results[i].data.attributes.originalLanguage,
            status: data.results[i].data.attributes.status
        })
    }
    return {data: reply, total: data.total}
}

const getChapterList = async (options: ChapterListOptions = {limit: mangadexUserStore.get('chapterLimit')}) => {
    let response = await globalLimiter.schedule(() => axios.get('/chapter', {params: options}))
    let data: ChapterListResponse = response.data
    let reply: Array<{
        id: string,
        volume: string,
        chapter: string,
        title: string,
        updatedAt: string,
        groupName: string
    }>
    for (let i = 0; i < data.results.length; i++) {
        reply.push({
            id: data.results[i].data.id,
            volume: data.results[i].data.attributes.volume,
            chapter: data.results[i].data.attributes.chapter,
            title: data.results[i].data.attributes.title,
            updatedAt: data.results[i].data.attributes.updatedAt,
            groupName: data.results[i].relationships.filter((value: PartialResponseObject<ResponseObject<AllAttributes, TypeUnion>>): value is ScanlationGroup => isPartialResponseObject<ScanlationGroup>(value, 'scanlation_group'))[0].attributes.name
        })
        chapterCache[data.results[i].data.id] = {
            data: data.results[i].data.attributes.data,
            dataSaver: data.results[i].data.attributes.dataSaver,
            hash: data.results[i].data.attributes.hash
        }
    }
    return {data: reply, total: data.total}
}

const getChapter = async (chapterId: string) => {
    let response = await globalLimiter.schedule(() => axios.get(`/chapter/${chapterId}`))
    let data: ChapterResponse = response.data
    let reply = {
        id: data.data.id,
        volume: data.data.attributes.volume,
        chapter: data.data.attributes.chapter,
        title: data.data.attributes.title,
        updatedAt: data.data.attributes.updatedAt,
        groupName: data.relationships.filter((value: PartialResponseObject<ResponseObject<AllAttributes, TypeUnion>>): value is ScanlationGroup => isPartialResponseObject<ScanlationGroup>(value, 'scanlation_group'))[0].attributes.name
    }
    chapterCache[data.data.id] = {
        data: data.data.attributes.data,
        dataSaver: data.data.attributes.dataSaver,
        hash: data.data.attributes.hash
    }
    return reply
}

const getServerURL = async (chapterId: string): Promise<string> => {
    let response = await globalLimiter.schedule(() => axios.get('/at-home/server/' + chapterId))
    return response.data
}

const getPage = async (chapterId: string, pageNo: number, serverURL: string, progressEvent: (event: ProgressEvent) => void, lowQuality = false) => {
    if (!chapterCache[chapterId]) {
        getChapter(chapterId)
    }
    let response = await globalLimiter.schedule(() => axios.get(`${serverURL}/${(lowQuality ? 'data-saver' : 'data')}/${chapterCache[chapterId].hash}/${lowQuality ? chapterCache[chapterId].dataSaver[pageNo-1] : chapterCache[chapterId].data[pageNo-1]}`, {onDownloadProgress: progressEvent}))
    return response.data
}

export const name = 'MangaDex'
type SearchOptionType = 'dropdown' | 'dichip' | 'trichip'
type SearchOptions = Array<{
    name: string,
    type: SearchOptionType,
    values: Array<{
        id: string,
        name: string
    }>
}>
export const searchOptions = (): SearchOptions => {
    return [
        {
            name: 'Sort',
            type: 'dropdown',
            values: [
                {
                    id: uuid(),
                    name: 'Ascending'
                }
            ]
        }
    ]
}