import { Prisma, PrismaClient } from "@prisma/client";
import { error } from "console";
import { Request, Response,NextFunction } from "express"
const prisma = new PrismaClient();

export const authorize=(roles:string[])=>{
    return async(req:Request,res:Response,next:NextFunction)=>{
        const userId=req.user?.id;
        if(!userId)
        {
            return res.status(401).json({error:'Unauthorized'});

        }
        try
        {
            const userRoles=await prisma.userRole.findMany({
                where:{userId},
                select:{role:true}
            });

            const hasRole = userRoles.some((ur) => roles.includes(ur.role));
            if (!hasRole) {
              return res.status(403).json({ error: 'Forbidden: Invalid role' });
            }           
          
            next();
          } 
          catch (err) {
            console.error('Role authorization error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        }
    }


