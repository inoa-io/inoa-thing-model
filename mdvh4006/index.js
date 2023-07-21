import {Buffer} from 'buffer';

export function translateMessage(thing, body, headers) {
    let result = [];
    try {
        const parts = body.urn.split(':');
        const buffer = Buffer.from(body.value, 'base64');
        const hexString = buffer.toString('hex');
        const slaveIdHex = hexString.substring(0, 2);
        const functionCode = hexString.substring(2, 4);
        const gatewayId = headers['gatewayName'] || headers['device_id'];
        const tenantId = headers['tenant_id'];

        if (parseInt(functionCode, 16) !== 3) {
            const message = `Retrieved modbus error message (functionCode ${functionCode}) with error ${parseInt(hexString.substring(4, 6), 16)}`;
            console.log(message);
            result.error = message;
            return result;
        }
        const byteCount = parseInt(hexString.substring(4, 6), 16);

        if (byteCount === 0) {
            const message = `Retrieved invalid modbus message (byteCount == 0): ${hexString}`;
            console.log(message);
            result.error = message;
            return result;
        }

        const dataEndIndex = 2 * byteCount + 6;
        const data = hexString.substring(6, dataEndIndex);

        let obisCode = '';
        let obisCodeShort = '';
        let label = '';
        let unit = '';
        let value = undefined;
        switch(parts[3]) {
            case '0x4000':
            case '0x4001':
                obisCode = '1-0:1.8.0';
                obisCodeShort = '1.8.0';
                label = 'work_in';
                unit = 'watthour';
                value = parseInt(data, 16);
                break;
            case '0x4100':
            case '0x4101':
                obisCode = '1-0:2.8.0';
                obisCodeShort = '2.8.0';
                label = 'work_out';
                unit = 'watthour';
                value = parseInt(data, 16);
                break;
            case '0x0000':
                label = 'power_in';
                unit = 'watt';
                obisCode = 'no_obis_code_found';
                obisCodeShort = 'no_obis_code_found';
                value = parseInt(data, 16) * 0.1;
                break;
            case '0x0002':
                label = 'power_out';
                unit = 'watt';
                obisCode = 'no_obis_code_found';
                obisCodeShort = 'no_obis_code_found';
                value = parseInt(data, 16) * 0.1;
                break;
            default:
            obisCode = 'no_obis_code_found';
        }
        result.push({
            urn: body.urn,
            thingId: thing.thingId,
            serial: thing.attributes.serial,            
            value: value,
            obisCode: obisCode,
            obisCodeShort: obisCodeShort,
            label: label,
            unit: unit,
            tenantId: tenantId,
            gatewayId: gatewayId,
            timestamp: body.timestamp

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
