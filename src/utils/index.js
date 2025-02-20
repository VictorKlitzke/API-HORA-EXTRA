function convertTimeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function validateArray(array) {
    if (!Array.isArray(array)) {
        throw new Error('Input must be an array.');
    }
}


module.exports = { convertTimeToMinutes , validateArray };