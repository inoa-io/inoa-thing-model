import {Buffer} from 'buffer';

export function translateMessage(thing, body, headers) {
    let result = {};
    console.log(body.urn.split(':'));
    console.log(thing.thingId);
    console.log(thing.attributes);
    console.log(thing.attributes.serial);
    console.log(JSON.stringify(thing));
    console.log("hallo");
    try {
        const buffer = Buffer.from(body.value, 'base64');
        const hexString = buffer.toString('hex');
        const slaveIdHex = hexString.substring(0, 2);
        const functionCode = hexString.substring(2, 4);

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

        result.value = {
            hexString: hexString,
            slaveIdHex: slaveIdHex,
            data: parseInt(data, 16)

        };
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

export function generateSatelliteConfig(gateway, thing) {
    const serial = parseInt(thing.attributes.serial + 1, 10);
    const modbus_interface = thing.attributes.modbus_interface;
    const channels = thing.attributes.channels;
    const hex = (serial % 100).toString();
    const slaveId = parseInt(hex, 16);
    console.log(slaveId);
    const res = [];
    for (const [key, value] of Object.entries(mappings)) {
        res.push({
            frame: Buffer.from(ModbusUtils.buildFrame(slaveId,value.functionCode,value.registerOffset,value.numberOfRegisters)).toString('base64'),
            timeout: 500,
            urn: `urn:${thing.attributes.deviceType}:${serial}:${value.registerOffset.toString(16).padStart(4,'0')}`
        })
    }
    return res;
}