import {Buffer} from 'buffer';

export function translateMessage(thing, body, headers) {
    let result = {};
    body.urn.split(':');
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

const FUNCTION_CODE_POWER_IN = 0x0000;
const FUNCTION_CODE_POWER_OUT = 0x0000;
const FUNCTION_CODE_OBIS_1_8_0 = 0x0000;
const FUNCTION_CODE_OBIS_2_8_0 = 0x0000;

export function generateSatelliteConfig(gateway, things) {

    new Uint8Array([3,]);
    return {};
}