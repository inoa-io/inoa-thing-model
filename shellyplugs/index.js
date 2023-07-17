import {Buffer} from 'buffer';

export function translateMessage(thing, body, headers) {
    let result = [];
    try {
        console.log(JSON.stringify(body));
        const buffer = Buffer.from(body.value, 'base64');
        console.log(buffer);
        const data = JSON.parse(buffer);

        const gatewayId = headers['gatewayName'] || headers['device_id'];
        const tenantId = headers['tenant_id'];

        result.push({
            urn: body.urn,
            thingId: thing.thingId,
            serial: thing.attributes.serial,            
            value: data.meters[0].power,
            obisCode: '1-0:1.8.0',
            obisCodeShort: '1.8.0',
            label: 'work_in',
            unit: 'watthour',
            tenantId: tenantId,
            gatewayId: gatewayId
        });

        result.push({
            urn: body.urn,
            thingId: thing.thingId,
            serial: thing.attributes.serial,            
            value: data.meters[0].power,
            obisCode: 'no_obis_code_found',
            obisCodeShort: 'no_obis_code_found',
            label: 'power_in',
            unit: 'watt',
            tenantId: tenantId,
            gatewayId: gatewayId
        });

        result.push({
            urn: body.urn,
            thingId: thing.thingId,
            serial: thing.attributes.serial,            
            value: data.meters[0].temperature,
            obisCode: 'no_obis_code_found',
            obisCodeShort: 'no_obis_code_found',
            label: 'temperature',
            unit: 'celsius',
            tenantId: tenantId,
            gatewayId: gatewayId
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
