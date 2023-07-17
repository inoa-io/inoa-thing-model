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
        switch(parts[3]) {
            case '0x4000':
            case '0x4001':
              obisCode = '1-0:1.8.0';
              obisCodeShort = '1.8.0';
              label = 'work_in';
              unit = 'watthour';
              break;
            case '0x4100':
            case '0x4101':
              obisCode = '1-0:2.8.0';
              obisCodeShort = '2.8.0';
              label = 'work_out';
              unit = 'watthour';
              break;
            case '0x0000':
              label = 'power_in';
              unit = 'watt';
              obisCode = 'no_obis_code_found';
              obisCodeShort = 'no_obis_code_found';
              break;
            case '0x0002':
              label = 'power_out';
              unit = 'watt';
              obisCode = 'no_obis_code_found';
              obisCodeShort = 'no_obis_code_found';
              break;
            default:
              obisCode = 'no_obis_code_found';
          }
        result.push({
            urn: body.urn,
            thingId: thing.thingId,
            serial: thing.attributes.serial,            
            value: parseInt(data, 16),
            obisCode: obisCode,
            obisCodeShort: obisCodeShort,
            label: label,
            unit: unit,
            tenantId: tenantId,
            gatewayId: gatewayId

        });
    } catch (e) {
        result.error = e.message;
        console.error(e);

    }
    return result;
}

const REGISTER_OFFSET_POWER_IN = 0x0000;
const REGISTER_OFFSET_POWER_OUT = 0x0002;
const REGISTER_OFFSET_OBIS_1_8_0 = 0x4001;
const REGISTER_OFFSET_OBIS_2_8_0 = 0x4101;

const mappings = {
    power_in: {
        functionCode: 3,
        registerOffset: REGISTER_OFFSET_POWER_IN,
        numberOfRegisters: 2
    },
    power_out: {
        functionCode: 3,
        registerOffset: REGISTER_OFFSET_POWER_OUT,
        numberOfRegisters: 2
    },
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
    const hex = (serial % 100).toString();
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