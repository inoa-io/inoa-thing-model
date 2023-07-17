import {Buffer} from 'buffer';

export function translateMessage(thing, body, headers) {
    let result = [];
    try {
        console.log(JSON.stringify(body));
        const buffer = Buffer.from(body.value, 'base64');
        console.log(buffer);
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
