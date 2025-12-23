#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedAppointments() {
  try {
    console.log("🌱 Seeding 4 sample appointments for today...");

    // Get the first available clinician, species, and appointment types
    const clinician = await prisma.clinician.findFirst({
      include: { user: true, branch: true },
    });

    const species = await prisma.species.findMany({ take: 2 });
    const appointmentTypes = await prisma.appointmentType.findMany({ take: 2 });

    if (!clinician || species.length === 0 || appointmentTypes.length === 0) {
      console.error(
        "❌ Missing required data: clinician, species, or appointment types",
      );
      console.log("Make sure you have at least:");
      console.log("- 1 clinician");
      console.log("- 1 species");
      console.log("- 1 appointment type");
      return;
    }

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // Create 4 sample appointments for today
    const sampleAppointments = [
      {
        hour: 8,
        minute: 0,
        petName: "Buddy",
        notes: "Regular checkup and vaccination",
        status: "scheduled",
        species: species[0],
        appointmentType: appointmentTypes[0],
      },
      {
        hour: 10,
        minute: 30,
        petName: "Whiskers",
        notes: "Dental cleaning and examination",
        status: "confirmed",
        species: species[1] || species[0],
        appointmentType: appointmentTypes[1] || appointmentTypes[0],
      },
      {
        hour: 14,
        minute: 0,
        petName: "Charlie",
        notes: "Surgery consultation",
        status: "pending",
        species: species[0],
        appointmentType: appointmentTypes[0],
      },
      {
        hour: 16,
        minute: 30,
        petName: "Luna",
        notes: "Emergency visit - limping",
        status: "active",
        species: species[1] || species[0],
        appointmentType: appointmentTypes[1] || appointmentTypes[0],
      },
    ];

    const appointments = [];
    for (const sample of sampleAppointments) {
      const startTime = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth(),
        todayStart.getDate(),
        sample.hour,
        sample.minute,
      );

      const endTime = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth(),
        todayStart.getDate(),
        sample.hour + 1,
        sample.minute,
      );

      const appointment = await prisma.appointment.create({
        data: {
          startTime,
          endTime,
          clinicianId: clinician.id,
          appointmentTypeId: sample.appointmentType.id,
          speciesId: sample.species.id,
          petName: sample.petName,
          notes: sample.notes,
          status: sample.status,
        },
      });

      appointments.push(appointment);
      console.log(
        `✅ Created appointment: ${sample.petName} at ${sample.hour}:${sample.minute.toString().padStart(2, "0")}`,
      );
    }

    console.log(
      `🎉 Successfully created ${appointments.length} sample appointments for today!`,
    );
    console.log(
      "📅 Go to your calendar view to see the stacked appointment cards in action.",
    );
  } catch (error) {
    console.error("❌ Error seeding appointments:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAppointments();
