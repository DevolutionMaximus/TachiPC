type SearchOptionType = 'dropdown' | 'dichip' | 'trichip' | 'disortchip' | 'trisortchip'
type SearchOptions = Array<{
    name: string,
    type: SearchOptionType,
    values: Array<{
        name: string,
        value: string
    }>
}>