import {Buffer} from 'buffer';

export function translateMessage(thing, body, headers) {
    let result = [];
    try {
        result.push({
            urn: body.urn,
            thingId: thing.thingId,
        });
    } catch (e) {
        result.error = e.message;
        console.error(e);

    }
    return result;
}



export function generateSatelliteConfig(gateway, things) {
    return {};
}
