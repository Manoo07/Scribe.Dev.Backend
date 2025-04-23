import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/utils/hashUtil';

const prisma = new PrismaClient();

async function main() {
  // Create College
  const college = await prisma.college.create({
    data: {
      name: 'OSMANIA UNIVERSITY',
    },
  });

  // Departments to create
  const departmentNames = ['CSE', 'ECE', 'BME', 'CE', 'ME', 'EEE', 'AIML'];

  // Create Departments
  const departments: any[] = [];
  for (const deptName of departmentNames) {
    const dept = await prisma.department.create({
      data: {
        name: deptName,
        collegeId: college.id,
      },
    });
    departments.push(dept);
  }

  // Years to create
  const yearNames = ['I', 'II', 'III', 'IV'];

  // Create Years for each department
  const years = [];
  for (const dept of departments) {
    for (const yearName of yearNames) {
      const year = await prisma.year.create({
        data: {
          name: yearName,
          departmentId: dept.id,
        },
      });
      years.push(year);
    }
  }

  // Create Section "ALPHA" for each year
  const sections = [];
  for (const year of years) {
    const section = await prisma.section.create({
      data: {
        name: 'ALPHA',
        yearId: year.id,
      },
    });
    sections.push(section);
  }

  // Create Users (Faculty and Students) with hashed passwords
  const passwordHash = await hashPassword('Password123');

  // Create a Principal User
  const principalUser = await prisma.user.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      username: 'principal_john',
      email: 'principal@osmania.edu',
      password: passwordHash,
      collegeId: college.id,
    },
  });

  // Assign Principal Role
  await prisma.userRole.create({
    data: {
      userId: principalUser.id,
      role: Role.PRINCIPAL,
      collegeId: college.id,
    },
  });

  // Create Faculty Users and assign them to departments and sections
  const facultyUsers = [];
  for (let i = 0; i < 5; i++) {
    const facultyUser = await prisma.user.create({
      data: {
        firstName: `FacultyFirst${i + 1}`,
        lastName: `FacultyLast${i + 1}`,
        username: `faculty${i + 1}`,
        email: `faculty${i + 1}@osmania.edu`,
        password: passwordHash,
        collegeId: college.id,
      },
    });

    // Assign Faculty Role with random department and section
    const department = departments[i % departments.length];
    const yearForSection = years.find((y) => y.departmentId === department.id);
    const section = sections.find((s) => s.yearId === yearForSection?.id);

    await prisma.userRole.create({
      data: {
        userId: facultyUser.id,
        role: Role.FACULTY,
        collegeId: college.id,
        departmentId: department.id,
        sectionId: section?.id,
      },
    });

    // Create Faculty profile
    const facultyProfile = await prisma.faculty.create({
      data: {
        userId: facultyUser.id,
        specialization: department.name,
      },
    });

    facultyUsers.push({ user: facultyUser, facultyProfile });
  }

  // Create Student Users and assign them to departments and sections
  for (let i = 0; i < 10; i++) {
    const studentUser = await prisma.user.create({
      data: {
        firstName: `StudentFirst${i + 1}`,
        lastName: `StudentLast${i + 1}`,
        username: `student${i + 1}`,
        email: `student${i + 1}@osmania.edu`,
        password: passwordHash,
        collegeId: college.id,
      },
    });

    // Assign Student Role with random department and section
    const department = departments[i % departments.length];
    const yearForSection = years.find((y) => y.departmentId === department.id);
    const section = sections.find((s) => s.yearId === yearForSection?.id);

    await prisma.userRole.create({
      data: {
        userId: studentUser.id,
        role: Role.STUDENT,
        collegeId: college.id,
        departmentId: department.id,
        sectionId: section?.id,
      },
    });

    // Create Student profile with enrollment number
    await prisma.student.create({
      data: {
        userId: studentUser.id,
        enrollmentNo: `ENR2025${i + 1}`,
      },
    });
  }

  // Create Virtual Classrooms for each section and assign to a faculty
  for (const section of sections) {
    // Pick a faculty from the same department as the section's year
    const year = years.find((y) => y.id === section.yearId);
    const facultyForDept = facultyUsers.find(
      (fu) => fu.facultyProfile.specialization === departments.find((d) => d.id === year?.departmentId)?.name
    );

    if (facultyForDept) {
      await prisma.virtualClassroom.create({
        data: {
          name: `Classroom for ${section.name} - ${year?.name}`,
          facultyId: facultyForDept.facultyProfile.id,
          syllabusUrl: 'http://example.com/syllabus.pdf',
        },
      });
    }
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
