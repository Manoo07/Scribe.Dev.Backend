import { User } from "@prisma/client";
import { prisma } from "../prismaClient"; // Adjust the import based on your prisma client setup
import { hashPassword, comparePasswords } from "../utils/hashUtil";
import { generateToken } from "../utils/jwtUtil";

export class AuthService {
  async signup(
    name: string,
    email: string,
    password: string,
    collegeId?: string
  ): Promise<User> {
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        collegeId,
      },
    });
    return user;
  }

  async signin(email: string, password: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && (await comparePasswords(password, user.password))) {
      return generateToken(user.id);
    }
    return null;
  }
}
