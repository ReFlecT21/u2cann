#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedGym() {
  try {
    console.log("🥊 Seeding boxing gym data...");

    // Clear existing gym data
    console.log("🧹 Clearing existing gym data...");
    await prisma.classBooking.deleteMany();
    await prisma.classSession.deleteMany();
    await prisma.classTemplate.deleteMany();
    await prisma.instructor.deleteMany();
    await prisma.gymClassType.deleteMany();

    // Find or create a team
    let team = await prisma.team.findFirst();
    if (!team) {
      console.log("📦 Creating team...");
      team = await prisma.team.create({
        data: {
          name: "U2CANN Boxing Gym",
        },
      });
    }
    console.log(`✅ Using team: ${team.name}`);

    // Find or create a branch
    let branch = await prisma.branch.findFirst({
      where: { teamId: team.id },
    });
    if (!branch) {
      console.log("🏢 Creating branch...");
      branch = await prisma.branch.create({
        data: {
          name: "Main Gym",
          location: "123 Boxing Street, Fight City, FC 12345",
          teamId: team.id,
          latitude: 40.7128,
          longitude: -74.006,
        },
      });
    }
    console.log(`✅ Using branch: ${branch.name}`);

    // Create class types
    console.log("📋 Creating class types...");
    const classTypes = await Promise.all([
      prisma.gymClassType.create({
        data: {
          name: "beginner_boxing",
          displayName: "Beginner Boxing",
          description: "Perfect for newcomers to learn the basics of boxing",
          duration: 60,
          defaultCapacity: 12,
          isOpenGym: false,
          color: "#3B82F6",
          teamId: team.id,
        },
      }),
      prisma.gymClassType.create({
        data: {
          name: "technique_fundamentals",
          displayName: "Technique Fundamentals",
          description: "Focus on proper form and fundamental techniques",
          duration: 60,
          defaultCapacity: 10,
          isOpenGym: false,
          color: "#8B5CF6",
          teamId: team.id,
        },
      }),
      prisma.gymClassType.create({
        data: {
          name: "advanced_training",
          displayName: "Advanced Training",
          description: "Intensive training for experienced boxers",
          duration: 90,
          defaultCapacity: 8,
          isOpenGym: false,
          color: "#EF4444",
          teamId: team.id,
        },
      }),
      prisma.gymClassType.create({
        data: {
          name: "conditioning",
          displayName: "Conditioning",
          description: "High-intensity conditioning and cardio boxing",
          duration: 60,
          defaultCapacity: 12,
          isOpenGym: false,
          color: "#10B981",
          teamId: team.id,
        },
      }),
      prisma.gymClassType.create({
        data: {
          name: "sparring_prep",
          displayName: "Sparring Prep",
          description: "Prepare for sparring with controlled drills",
          duration: 60,
          defaultCapacity: 10,
          isOpenGym: false,
          color: "#F59E0B",
          teamId: team.id,
        },
      }),
      prisma.gymClassType.create({
        data: {
          name: "open_gym",
          displayName: "Open Gym",
          description: "Self-guided training with equipment access",
          duration: 300, // 5 hours
          defaultCapacity: 30,
          isOpenGym: true,
          color: "#FBBF24",
          teamId: team.id,
        },
      }),
      prisma.gymClassType.create({
        data: {
          name: "evening_basics",
          displayName: "Evening Basics",
          description: "After-work fundamentals class for all levels",
          duration: 60,
          defaultCapacity: 15,
          isOpenGym: false,
          color: "#6366F1",
          teamId: team.id,
        },
      }),
      prisma.gymClassType.create({
        data: {
          name: "strength_power",
          displayName: "Strength & Power",
          description: "Build boxing-specific strength and power",
          duration: 60,
          defaultCapacity: 12,
          isOpenGym: false,
          color: "#EC4899",
          teamId: team.id,
        },
      }),
      prisma.gymClassType.create({
        data: {
          name: "footwork_defense",
          displayName: "Footwork & Defense",
          description: "Master defensive techniques and movement",
          duration: 60,
          defaultCapacity: 10,
          isOpenGym: false,
          color: "#14B8A6",
          teamId: team.id,
        },
      }),
      prisma.gymClassType.create({
        data: {
          name: "technical_boxing",
          displayName: "Technical Boxing",
          description: "Advanced technical training and combinations",
          duration: 75,
          defaultCapacity: 8,
          isOpenGym: false,
          color: "#F97316",
          teamId: team.id,
        },
      }),
    ]);
    console.log(`✅ Created ${classTypes.length} class types`);

    // Create instructors
    console.log("👨‍🏫 Creating instructors...");
    const instructors = await Promise.all([
      prisma.instructor.create({
        data: {
          name: "Mike Johnson",
          specialty: "Boxing Fundamentals",
          bio: "Former amateur champion with 15 years coaching experience",
          branchId: branch.id,
        },
      }),
      prisma.instructor.create({
        data: {
          name: "Sarah Lee",
          specialty: "Technical Training",
          bio: "Professional boxing coach specializing in technique refinement",
          branchId: branch.id,
        },
      }),
      prisma.instructor.create({
        data: {
          name: "Carlos Martinez",
          specialty: "Advanced Training",
          bio: "World-class trainer with Olympic coaching experience",
          branchId: branch.id,
        },
      }),
    ]);
    console.log(`✅ Created ${instructors.length} instructors`);

    // Helper to get class type by name
    const getClassType = (name: string) =>
      classTypes.find((ct) => ct.name === name)!;

    // Helper to get instructor by name
    const getInstructor = (name: string) =>
      instructors.find((i) => i.name === name)!;

    // Create class templates (recurring weekly schedule)
    console.log("📅 Creating class templates...");
    const templates = await Promise.all([
      // MONDAY
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("beginner_boxing").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 1, // Monday
          startTime: "07:00",
          endTime: "08:00",
          capacity: 12,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("technique_fundamentals").id,
          instructorId: getInstructor("Sarah Lee").id,
          branchId: branch.id,
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "09:00",
          capacity: 10,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("advanced_training").id,
          instructorId: getInstructor("Carlos Martinez").id,
          branchId: branch.id,
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "10:30",
          capacity: 8,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("conditioning").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "11:00",
          capacity: 12,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("sparring_prep").id,
          instructorId: getInstructor("Sarah Lee").id,
          branchId: branch.id,
          dayOfWeek: 1,
          startTime: "11:00",
          endTime: "12:00",
          capacity: 10,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("open_gym").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 1,
          startTime: "12:00",
          endTime: "17:00",
          capacity: 30,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("evening_basics").id,
          instructorId: getInstructor("Carlos Martinez").id,
          branchId: branch.id,
          dayOfWeek: 1,
          startTime: "17:00",
          endTime: "18:00",
          capacity: 15,
        },
      }),

      // TUESDAY
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("technical_boxing").id,
          instructorId: getInstructor("Carlos Martinez").id,
          branchId: branch.id,
          dayOfWeek: 2,
          startTime: "09:00",
          endTime: "10:15",
          capacity: 8,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("strength_power").id,
          instructorId: getInstructor("Sarah Lee").id,
          branchId: branch.id,
          dayOfWeek: 2,
          startTime: "10:00",
          endTime: "11:00",
          capacity: 12,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("footwork_defense").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 2,
          startTime: "11:00",
          endTime: "12:00",
          capacity: 10,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("open_gym").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 2,
          startTime: "12:00",
          endTime: "17:00",
          capacity: 30,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("beginner_boxing").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 2,
          startTime: "17:00",
          endTime: "18:00",
          capacity: 15,
        },
      }),

      // WEDNESDAY
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("beginner_boxing").id,
          instructorId: getInstructor("Carlos Martinez").id,
          branchId: branch.id,
          dayOfWeek: 3,
          startTime: "07:00",
          endTime: "08:00",
          capacity: 12,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("technique_fundamentals").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 3,
          startTime: "08:00",
          endTime: "09:00",
          capacity: 10,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("advanced_training").id,
          instructorId: getInstructor("Sarah Lee").id,
          branchId: branch.id,
          dayOfWeek: 3,
          startTime: "09:00",
          endTime: "10:30",
          capacity: 8,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("conditioning").id,
          instructorId: getInstructor("Carlos Martinez").id,
          branchId: branch.id,
          dayOfWeek: 3,
          startTime: "10:00",
          endTime: "11:00",
          capacity: 12,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("sparring_prep").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 3,
          startTime: "11:00",
          endTime: "12:00",
          capacity: 10,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("open_gym").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 3,
          startTime: "12:00",
          endTime: "17:00",
          capacity: 30,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("evening_basics").id,
          instructorId: getInstructor("Sarah Lee").id,
          branchId: branch.id,
          dayOfWeek: 3,
          startTime: "17:00",
          endTime: "18:00",
          capacity: 15,
        },
      }),

      // THURSDAY
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("conditioning").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 4,
          startTime: "07:00",
          endTime: "08:00",
          capacity: 12,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("technique_fundamentals").id,
          instructorId: getInstructor("Sarah Lee").id,
          branchId: branch.id,
          dayOfWeek: 4,
          startTime: "08:00",
          endTime: "09:00",
          capacity: 10,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("technical_boxing").id,
          instructorId: getInstructor("Carlos Martinez").id,
          branchId: branch.id,
          dayOfWeek: 4,
          startTime: "09:00",
          endTime: "10:15",
          capacity: 8,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("strength_power").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 4,
          startTime: "10:00",
          endTime: "11:00",
          capacity: 12,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("footwork_defense").id,
          instructorId: getInstructor("Sarah Lee").id,
          branchId: branch.id,
          dayOfWeek: 4,
          startTime: "11:00",
          endTime: "12:00",
          capacity: 10,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("open_gym").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 4,
          startTime: "12:00",
          endTime: "17:00",
          capacity: 30,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("beginner_boxing").id,
          instructorId: getInstructor("Carlos Martinez").id,
          branchId: branch.id,
          dayOfWeek: 4,
          startTime: "17:00",
          endTime: "18:00",
          capacity: 15,
        },
      }),

      // FRIDAY
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("beginner_boxing").id,
          instructorId: getInstructor("Sarah Lee").id,
          branchId: branch.id,
          dayOfWeek: 5,
          startTime: "07:00",
          endTime: "08:00",
          capacity: 12,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("technique_fundamentals").id,
          instructorId: getInstructor("Carlos Martinez").id,
          branchId: branch.id,
          dayOfWeek: 5,
          startTime: "08:00",
          endTime: "09:00",
          capacity: 10,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("advanced_training").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 5,
          startTime: "09:00",
          endTime: "10:30",
          capacity: 8,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("conditioning").id,
          instructorId: getInstructor("Sarah Lee").id,
          branchId: branch.id,
          dayOfWeek: 5,
          startTime: "10:00",
          endTime: "11:00",
          capacity: 12,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("sparring_prep").id,
          instructorId: getInstructor("Carlos Martinez").id,
          branchId: branch.id,
          dayOfWeek: 5,
          startTime: "11:00",
          endTime: "12:00",
          capacity: 10,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("open_gym").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 5,
          startTime: "12:00",
          endTime: "17:00",
          capacity: 30,
        },
      }),
      prisma.classTemplate.create({
        data: {
          classTypeId: getClassType("evening_basics").id,
          instructorId: getInstructor("Mike Johnson").id,
          branchId: branch.id,
          dayOfWeek: 5,
          startTime: "17:00",
          endTime: "18:00",
          capacity: 15,
        },
      }),
    ]);
    console.log(`✅ Created ${templates.length} class templates`);

    // Generate sessions for the current week and next week
    console.log("🗓️ Generating class sessions from templates...");
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    currentWeekStart.setHours(0, 0, 0, 0);

    const sessionsToCreate: any[] = [];

    // Generate for 2 weeks
    for (let week = 0; week < 2; week++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(weekStart.getDate() + week * 7);

      for (const template of templates) {
        const sessionDate = new Date(weekStart);
        sessionDate.setDate(weekStart.getDate() + template.dayOfWeek - 1);

        const startParts = template.startTime.split(":");
        const endParts = template.endTime.split(":");
        const startHour = Number(startParts[0]) || 0;
        const startMin = Number(startParts[1]) || 0;
        const endHour = Number(endParts[0]) || 0;
        const endMin = Number(endParts[1]) || 0;

        const startTime = new Date(sessionDate);
        startTime.setHours(startHour, startMin, 0, 0);

        const endTime = new Date(sessionDate);
        endTime.setHours(endHour, endMin, 0, 0);

        sessionsToCreate.push({
          classTypeId: template.classTypeId,
          instructorId: template.instructorId,
          branchId: template.branchId,
          startTime,
          endTime,
          capacity: template.capacity,
          templateId: template.id,
          bookedCount: 0,
        });
      }
    }

    await prisma.classSession.createMany({
      data: sessionsToCreate,
    });
    console.log(`✅ Created ${sessionsToCreate.length} class sessions`);

    // Create sample bookings
    console.log("📝 Creating sample bookings...");
    const sessions = await prisma.classSession.findMany({
      where: {
        startTime: {
          gte: new Date(),
        },
      },
      take: 30,
    });

    const guestNames = [
      "Alex Johnson",
      "Sam Williams",
      "Jordan Smith",
      "Taylor Brown",
      "Casey Davis",
      "Morgan Wilson",
      "Jamie Miller",
      "Riley Anderson",
      "Quinn Thomas",
      "Avery Martinez",
    ];

    const bookings: any[] = [];
    for (let i = 0; i < Math.min(sessions.length, 20); i++) {
      const session = sessions[i];
      const numBookings = Math.floor(Math.random() * 4) + 1; // 1-4 bookings per session

      for (let j = 0; j < numBookings; j++) {
        const guestName = guestNames[Math.floor(Math.random() * guestNames.length)];
        const email = `${guestName.toLowerCase().replace(" ", ".")}${Math.floor(Math.random() * 100)}@example.com`;

        // Check if this email already has a booking for this session
        const existing = bookings.find(
          (b) => b.sessionId === session.id && b.guestEmail === email
        );
        if (existing) continue;

        bookings.push({
          sessionId: session.id,
          guestName,
          guestEmail: email,
          guestPhone: `+1555${Math.floor(Math.random() * 9000000 + 1000000)}`,
          status: "confirmed" as const,
        });
      }
    }

    // Create bookings and update session counts
    for (const bookingData of bookings) {
      await prisma.classBooking.create({
        data: bookingData,
      });
      await prisma.classSession.update({
        where: { id: bookingData.sessionId },
        data: { bookedCount: { increment: 1 } },
      });
    }
    console.log(`✅ Created ${bookings.length} bookings`);

    console.log("\n🎉 Boxing gym seed data created successfully!");
    console.log(`📋 ${classTypes.length} class types`);
    console.log(`👨‍🏫 ${instructors.length} instructors`);
    console.log(`📅 ${templates.length} templates`);
    console.log(`🗓️ ${sessionsToCreate.length} sessions`);
    console.log(`📝 ${bookings.length} bookings`);

  } catch (error) {
    console.error("❌ Error seeding gym data:", error);
    throw error;
  }
}

async function main() {
  try {
    await seedGym();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
