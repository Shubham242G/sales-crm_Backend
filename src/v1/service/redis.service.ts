import { createClient } from 'redis';


export const redis = createClient({ url:'redis://127.0.0.1:6379' });

redis.on('error', err => console.log('Redis Client Error', err));
redis.on('ready', () => console.log('Redis Client Is Connected'));

redis.connect();

export async function updateObjInRedis(key: string, payload: any): Promise<any> {
    try {
        await redis.set(key, JSON.stringify(payload));
        return true;
    } catch (error) {
        console.error('error in updateObjInRedis==> ', error);
        throw error;
    }
}

/**
 * get chat data from redis
 * @param key
 */
export async function getDataFromRedis(key: string): Promise<any> {
    try {
        let data: any = await redis.get(key);
        if (data) return JSON.parse(data);
        else return null;
    } catch (error) {
        console.error('error in getDataFromRedis==> ', error);
        throw error;
    }
}


export async function deleteRedisKey(key: string) {
    try {
        let redistData: any = await redis.get(key);
        if (redistData) {
            await redis.del(key);
        }
    } catch (error) {
        throw error;
    }
}