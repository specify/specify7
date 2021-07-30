export default function(value, message) {
        if (!value) {
            throw new Error(message);
        }
    };

