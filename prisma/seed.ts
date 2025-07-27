import { PrismaClient, Role } from '@prisma/client';
import { logger } from '@services/logService';
import { hashPassword } from '../src/utils/hashUtil';

const prisma = new PrismaClient();

async function main() {
  const college = await prisma.college.create({
    data: { name: 'OSMANIA UNIVERSITY' },
  });

  const departmentNames = ['CSE', 'ECE', 'BME', 'CE', 'ME', 'EEE', 'AIML'];
  const departments = [];

  for (const name of departmentNames) {
    const dept = await prisma.department.create({
      data: { name, collegeId: college.id },
    });
    departments.push(dept);
  }

  const yearNames = ['I', 'II', 'III', 'IV'];
  const years: { id: string; name: string; createdAt: Date; updatedAt: Date; departmentId: string }[] = [];

  for (const dept of departments) {
    for (const name of yearNames) {
      const year = await prisma.year.create({
        data: { name, departmentId: dept.id },
      });
      years.push(year);
    }
  }

  const sections: { id: string; createdAt: Date; updatedAt: Date; name: string; yearId: string }[] = [];
  for (const year of years) {
    const section = await prisma.section.create({
      data: { name: 'ALPHA', yearId: year.id },
    });
    sections.push(section);
  }

  const passwordHash = await hashPassword('Password123');

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

  await prisma.userRole.create({
    data: {
      userId: principalUser.id,
      role: Role.PRINCIPAL,
      collegeId: college.id,
    },
  });

  const cseDepartment = departments.find((d) => d.name === 'CSE');
  if (!cseDepartment) throw new Error('CSE Department not found');

  const getSectionAndYearForDepartment = (deptId: string) => {
    const year = years.find((y) => y.departmentId === deptId);
    const section = sections.find((s) => s.yearId === year?.id);
    return { section, year };
  };

  const specificFaculty = [
    { email: 'manoharboinapalli@gmail.com', firstName: 'Manohar', lastName: 'Boinapally' },
    { email: 'bandirs2003@gmail.com', firstName: 'Bandi', lastName: 'Rajashree' },
  ];

  for (const faculty of specificFaculty) {
    const user = await prisma.user.create({
      data: {
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        username: faculty.email.split('@')[0],
        email: faculty.email,
        password: passwordHash,
        collegeId: college.id,
      },
    });

    const { section, year } = getSectionAndYearForDepartment(cseDepartment.id);

    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: Role.FACULTY,
        collegeId: college.id,
        departmentId: cseDepartment.id,
        sectionId: section?.id,
        yearId: year?.id,
      },
    });

    await prisma.faculty.create({
      data: {
        userId: user.id,
        specialization: cseDepartment.name,
      },
    });
  }

  const specificStudents = [
    { email: 'manoharboinapalli2003@gmail.com', firstName: 'Manohar', lastName: 'Boinapally' },
    { email: 'bandirajashree744@gmail.com', firstName: 'Bandi', lastName: 'Rajashree' },
  ];

  for (let i = 0; i < specificStudents.length; i++) {
    const info = specificStudents[i];
    const user = await prisma.user.create({
      data: {
        firstName: info.firstName,
        lastName: info.lastName,
        username: info.email.split('@')[0],
        email: info.email,
        password: passwordHash,
        collegeId: college.id,
      },
    });

    const { section, year } = getSectionAndYearForDepartment(cseDepartment.id);

    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: Role.STUDENT,
        collegeId: college.id,
        departmentId: cseDepartment.id,
        sectionId: section?.id,
        yearId: year?.id,
      },
    });

    await prisma.student.create({
      data: {
        userId: user.id,
        enrollmentNo: `ENR2025_SPEC${i + 1}`,
      },
    });
  }

  const facultyUsers = [];
  for (let i = 0; i < 5; i++) {
    const dept = departments[i % departments.length];
    const { section, year } = getSectionAndYearForDepartment(dept.id);

    const user = await prisma.user.create({
      data: {
        firstName: `FacultyFirst${i + 1}`,
        lastName: `FacultyLast${i + 1}`,
        username: `faculty${i + 1}`,
        email: `faculty${i + 1}@osmania.edu`,
        password: passwordHash,
        collegeId: college.id,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: Role.FACULTY,
        collegeId: college.id,
        departmentId: dept.id,
        sectionId: section?.id,
        yearId: year?.id,
      },
    });

    const profile = await prisma.faculty.create({
      data: {
        userId: user.id,
        specialization: dept.name,
      },
    });

    facultyUsers.push({ user, facultyProfile: profile });
  }

  for (let i = 0; i < 10; i++) {
    const dept = departments[i % departments.length];
    const { section, year } = getSectionAndYearForDepartment(dept.id);

    const user = await prisma.user.create({
      data: {
        firstName: `StudentFirst${i + 1}`,
        lastName: `StudentLast${i + 1}`,
        username: `student${i + 1}`,
        email: `student${i + 1}@osmania.edu`,
        password: passwordHash,
        collegeId: college.id,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: Role.STUDENT,
        collegeId: college.id,
        departmentId: dept.id,
        sectionId: section?.id,
        yearId: year?.id,
      },
    });

    await prisma.student.create({
      data: {
        userId: user.id,
        enrollmentNo: `ENR2025${i + 1}`,
      },
    });
  }

  for (const section of sections) {
    const year = years.find((y) => y.id === section.yearId);
    const dept = departments.find((d) => d.id === year?.departmentId);
    const faculty = facultyUsers.find((f) => f.facultyProfile.specialization === dept?.name);

    if (faculty) {
      await prisma.virtualClassroom.create({
        data: {
          name: `Classroom for ${section.name} - ${year?.name}`,
          facultyId: faculty.facultyProfile.id,
          sectionId: section.id,
          syllabusUrl: 'http://example.com/syllabus.pdf',
        },
      });
    }
  }

  const manoharUser = await prisma.user.findUnique({
    where: { email: 'manoharboinapalli@gmail.com' },
    include: { faculty: true },
  });

  if (manoharUser?.faculty) {
    const { section, year } = getSectionAndYearForDepartment(cseDepartment.id);

    for (let i = 1; i <= 4; i++) {
      const vc = await prisma.virtualClassroom.create({
        data: {
          name: `Special VC ${i} for Manohar`,
          facultyId: manoharUser.faculty.id,
          sectionId: section!.id,
          syllabusUrl: 'http://example.com/special_syllabus.pdf',
        },
      });

      const numStudents = i === 4 ? 2 : 1;

      for (let j = 1; j <= numStudents; j++) {
        const user = await prisma.user.create({
          data: {
            firstName: `SpecStudent${i}${j}`,
            lastName: 'CSE',
            username: `specstudent${i}${j}`,
            email: `specstudent${i}${j}@osmania.edu`,
            password: passwordHash,
            collegeId: college.id,
          },
        });

        await prisma.userRole.create({
          data: {
            userId: user.id,
            role: Role.STUDENT,
            collegeId: college.id,
            departmentId: cseDepartment.id,
            sectionId: section!.id,
            yearId: year?.id,
          },
        });

        const student = await prisma.student.create({
          data: {
            userId: user.id,
            enrollmentNo: `ENR-${i}${j}`,
          },
        });

        await prisma.virtualClassroomStudent.create({
          data: {
            classroomId: vc.id,
            studentId: student.id,
          },
        });
      }
    }
  }

  const allVirtualClassrooms = await prisma.virtualClassroom.findMany();

  for (const classroom of allVirtualClassrooms) {
    for (let unitIndex = 1; unitIndex <= 5; unitIndex++) {
      const unit = await prisma.unit.create({
        data: {
          name: `Unit ${unitIndex} - ${classroom.name}`,
          description: `This is the description for Unit ${unitIndex} in ${classroom.name}.`,
          classroomId: classroom.id,
        },
      });

      for (let contentIndex = 1; contentIndex <= 15; contentIndex++) {
        // Cycle through types evenly: NOTE, VIDEO, DOCUMENT, LINK
        const types = ['NOTE', 'VIDEO', 'DOCUMENT', 'LINK'];
        const type = types[(contentIndex - 1) % types.length];

        let contentValue = '';
        switch (type) {
          case 'NOTE':
            contentValue = `This is a NOTE for Unit ${unitIndex}, Content ${contentIndex}.`;
            break;
          case 'VIDEO':
            contentValue = `https://www.example.com/video/unit-${unitIndex}-content-${contentIndex}`;
            break;
          case 'DOCUMENT':
            contentValue = `https://www.example.com/docs/unit-${unitIndex}-content-${contentIndex}.pdf`;
            break;
          case 'LINK':
            contentValue = `https://www.example.com/resources/unit-${unitIndex}-content-${contentIndex}`;
            break;
        }

        await prisma.educationalContent.create({
          data: {
            unitId: unit.id,
            type: type as any,
            content: contentValue,
          },
        });
      }
    }
  }

  logger.info('Seeding completed successfully.');
}

main()
  .catch((e) => {
    logger.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
