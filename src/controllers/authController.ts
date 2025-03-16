import { Request, Response } from 'express';
import AuthService from '../services/authService';
import { promises } from 'dns';

class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = async (req: Request, res: Response): Promise<any> => {
    const { name, email, password, collegeId, role, departmentId, sectionId, specialization } = req.body;

    try {
      // Call the signup service with all required parameters
      const result = await this.authService.signup({
        name,
        email,
        password,
        collegeId,
        role,
        departmentId,
        sectionId,
        specialization,
      });

      if (result.error) {
        return res.status(result.status || 400).json({ error: result.error, message: result.message });
      }

      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Signup Error:', error);

      if (error.message.includes('Invalid collegeId')) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: 'An unknown error occurred' });
    }
  };

  signin = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
      const token = await this.authService.signin(email, password);
      if (token) {
        res.status(200).json({ token });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

export default AuthController;
