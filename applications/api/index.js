const twitter = require( 'twitter' )
const requestKey = require( './requestKey' )

const getClient = ( access_token_key, access_token_secret ) => {
    if( access_token_key === undefined || access_token_secret === undefined ) return false
    let client = new twitter( {
        consumer_key       : requestKey.consumer_key,
        consumer_secret    : requestKey.consumer_secret,
        access_token_key   : access_token_key,
        access_token_secret: access_token_secret
    } )
    return client
}
const makeOption = condition => {
    var option = {}
    if( typeof( condition ) === 'number' )
        option.user_id = condition
    else
        option.screen_name = condition
    return option
}

module.exports = yacona => {
    
    const yaml = yacona.moduleLoader( 'yaml' )
    
    let userSetting
    let userProfile
    let client
    
    let isReady      = false
    let isAuthorized = false
    let isAvailable  = false
    
    let isReadyCallbackTargets = []
    let isAvailableCallbackTargets = []
    
    yacona.on( 'ready', callback => {
        if( isReady === true ) callback()
        else isReadyCallbackTargets.push( callback )
    } )
    yacona.on( 'available', callback => {
        console.log( 'isAvailable : ' + isAvailable )
        if( isAvailable === true ){
            console.log( 'ava true' )
            callback()
        }
        else isAvailableCallbackTargets.push( callback )
    } )
    yacona.on( 'isAuthorized', () => isAuthorized )
    
    const emitIsReady = () => {
        isReady = true
        for( ;isReadyCallbackTargets.length; ) isReadyCallbackTargets.shift()()
    }
    const emitIsAvailable = () => {
        console.log( 'Change is available' )
        isAvailable = true
        for( ;isAvailableCallbackTargets.length; ) isAvailableCallbackTargets.shift()()
    }
    
    /* ----- Check ----- */
    
    if( yacona.config.check( 'twitter/authorization.yaml' ) === true ) isAuthorized = true
    

    const getProfile = id => {
        if( id === undefined ) return false
        return new Promise( ( resolve, reject ) => {
            client.get( 'users/show', makeOption( id ), ( error, profile, response ) => {
                if( error === null ) resolve( profile )
                else reject( error )
            } )
        } )
    }
    
    const load = () => {
        userSetting = yaml.parser( yacona.config.load( 'twitter/authorization.yaml' ) )
        client      = getClient( userSetting.access_token, userSetting.access_token_secret )
        getProfile( userSetting.id ).then( profile => {
            isAvailable = true
            emitIsAvailable()
            console.log( profile )
        } )
    }
    
    yacona.on( 'twitter/key', () => requestKey )
    yacona.on( 'twitter/authorized', data => {
        data.id = Number( data.id )
        yacona.config.save( 'twitter/authorization.yaml', yaml.dump( data ) )
        load()
        return true
    } )
    
    yacona.on( 'app/startup', ( appName ) => {
        yacona.localAppLoader( '../' + appName )
    } )
    
    emitIsReady()
    
    if( isAuthorized === true ) load()
    
}