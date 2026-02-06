import { useEffect, useState } from 'react';

const useDebouncedValue = (value, delay = 400) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handle);
    }, [value, delay]);

    return debouncedValue;
};

export default useDebouncedValue;
