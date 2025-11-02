import express from "express";

import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from "@aws-sdk/client-auto-scaling";
import { DescribeAccountAttributesCommand, DescribeInstancesCommand, EC2Client } from "@aws-sdk/client-ec2";

const app = express();

const client = new AutoScalingClient({
    region:'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const ec2Client = new EC2Client({
    region:'us-west-2',
    credentials: {  
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

type Machine = {
    ip:string;
    isUsed:boolean;
    assignedProject?:string;

}


const All_Machines:Machine[] = []

async function refreshInstance(){
    const copmmand = new DescribeAutoScalingGroupsCommand();
    const data = await client.send(copmmand);
    
    const ec2InstanceCommand = new DescribeInstancesCommand({
        InstanceIds: data.AutoScalingInstances?.map(x => x.InstanceId)
    })

    const ec2Response = await ec2Client.send(ec2InstanceCommand);
     // TODO: Enrich the ALL_MACHINES array with the new instances, and remove the instances that have died
}


