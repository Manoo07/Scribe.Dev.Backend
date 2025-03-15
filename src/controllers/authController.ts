import { Request, Response } from "express";
import { AuthService } from "../services/authService";

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = async (req: Request, res: Response) => {
    const { name, email, password, collegeId } = req.body;
    try {
      const user = await this.authService.signup(
        name,
        email,
        password,
        collegeId
      );
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof Error) {
        if (error instanceof Error) {
          if (error instanceof Error) {
            res.status(400).json({ error: error.message });
          } else {
            res.status(400).json({ error: "An unknown error occurred" });
          }
        } else {
          res.status(400).json({ error: "An unknown error occurred" });
        }
      } else {
        res.status(400).json({ error: "An unknown error occurred" });
      }
    }
  };

  signin = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
      const token = await this.authService.signin(email, password);
      if (token) {
        res.status(200).json({ token });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

export default AuthController;
