import { redis } from "bun";


const redisClient = new redis({
  url: process.env.REDIS_URL,
});

export async function adNewPod(pod:string){
    await redisClient.hset("POD_MAPPING", pod,"empty");
    await redisClient.expire("POD_MAPPING", 300);
}

export async function removePod(pod:string){
    await redisClient.hDel("POD_MAPPING", pod);
}

export async function getAllPods():Promise<{[key:string]:string}>{
    const allPods = await redisClient.hgetall("POD_MAPPING");
    return allPods;
}

export async function addProjectToPod(projectId:string,pod:string){
    await redisClient.hset("POD_MAPPING", pod, projectId);
    await redisClient.expire("POD_MAPPING", 300);
}