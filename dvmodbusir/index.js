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
            case '0x000D':
                obisCode = '1-0:1.8.0';
                obisCodeShort = '1.8.0';
                label = 'work_in';
                unit = 'watthour';
                value = parseInt(data, 16);
                break;
            case '0x0012':
                obisCode = '1-0:1.8.1';
                obisCodeShort = '1.8.1';
                label = 'work_in';
                unit = 'watthour';
                value = parseInt(data, 16);
                break;
            case '0x0017':
                obisCode = '1-0:1.8.2';
                obisCodeShort = '1.8.2';
                label = 'work_in';
                unit = 'watthour';
                value = parseInt(data, 16);
                break;
            case '0x001C':
                obisCode = '1-0:2.8.0';
                obisCodeShort = '2.8.0';
                label = 'work_out';
                unit = 'watthour';
                value = parseInt(data, 16);
                break;
            case '0x0021':
                obisCode = '1-0:2.8.1';
                obisCodeShort = '2.8.1';
                label = 'work_out';
                unit = 'watthour';
                value = parseInt(data, 16);
                break;
            case '0x0026':
                obisCode = '1-0:2.8.2';
                obisCodeShort = '2.8.2';
                label = 'work_out';
                unit = 'watthour';
                value = parseInt(data, 16);
                break;

            case '0x002B':
                label = 'power_in';
                unit = 'watt';
                obisCode = 'no_obis_code_found';
                obisCodeShort = 'no_obis_code_found';
                value = parseInt(data, 16);
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



const FUNCTION_CODE_SERIAL_NUMBER = 0x000B;
const REGISTER_OFFSET_OBIS_1_8_0 = 0x000D;
const REGISTER_OFFSET_OBIS_1_8_1 = 0x0012;
const REGISTER_OFFSET_OBIS_1_8_2 = 0x0017;
const REGISTER_OFFSET_OBIS_2_8_0 = 0x001C;
const REGISTER_OFFSET_OBIS_2_8_1 = 0x0021;
const REGISTER_OFFSET_OBIS_2_8_2 = 0x0026;
const FUNCTION_CODE_OBIS_1_7_0 = 0x002B;

const mappings = {
    obis_1_8_0: {
        functionCode: 3,
        registerOffset: REGISTER_OFFSET_OBIS_1_8_0,
        numberOfRegisters: 2
    },
    obis_2_8_0: {
        functionCode: 3,
        registerOffset: REGISTER_OFFSET_OBIS_2_8_0,
        numberOfRegisters: 2
    }
}

export function generateSatelliteConfig(thing) {
    const serial = parseInt(thing.attributes.serial + 1, 10);
    const modbus_interface = thing.attributes.modbus_interface;
    const channels = thing.attributes.channels;
    const hex = (serial % 1000).toString();
    const slaveId = parseInt(hex, 16);
    if (slaveId > 255) {
        console.error(`slaveId greater then 255 id: ${slaveId} -- serial: ${serial}`);
    }
    const res = [];
    for (const [key, value] of Object.entries(mappings)) {
        res.push({
            type: "RS485",
            name: serial,
            interval: 30000,
            interface: modbus_interface,
            frame: Buffer.from(ModbusUtils.buildFrame(slaveId,value.functionCode,value.registerOffset,value.numberOfRegisters)).toString('base64'),
            timeout: 500,
            id: `urn:${thing.attributes.thingType}:${serial}:x${value.registerOffset.toString(16).padStart(4,'0')}`
        })
    }
    return res;
}
