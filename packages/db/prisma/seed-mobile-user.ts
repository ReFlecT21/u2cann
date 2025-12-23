#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USER_ID = "user_33gVxw7OOmrIMTdAQWcwCyazMqw";

async function seedUserData() {
  try {
    console.log(`🌱 Seeding data for user ${USER_ID}...`);

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: USER_ID } });
    if (!user) {
      console.error(`❌ User ${USER_ID} not found. Please sign up first.`);
      process.exit(1);
    }
    console.log(`✅ Found user: ${user.firstName} ${user.lastName}`);

    // Create vet clinics
    console.log("🏥 Creating vet clinics...");
    const vetClinics = await Promise.all([
      prisma.vetClinic.upsert({
        where: { id: "clinic_001" },
        update: {},
        create: {
          id: "clinic_001",
          name: "Happy Paws Veterinary Clinic",
          address: "123 Pet Street, Pet City, PC 12345",
          phone: "+1555123456",
          email: "info@happypaws.com",
          description: "Comprehensive veterinary care for all your pets. We provide general checkups, vaccinations, surgery, and emergency care.",
          rating: 4.8,
          latitude: 40.7128,
          longitude: -74.0060,
          openingTime: "08:00",
          closingTime: "18:00",
          avatar: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=300&h=200&fit=crop"
        },
      }),
      prisma.vetClinic.upsert({
        where: { id: "clinic_002" },
        update: {},
        create: {
          id: "clinic_002",
          name: "City Animal Hospital",
          address: "456 Animal Avenue, Pet City, PC 12346",
          phone: "+1555123457",
          email: "contact@cityanimalhospital.com",
          description: "24/7 emergency care and specialized treatments. Expert care when your pet needs it most.",
          rating: 4.6,
          latitude: 40.7589,
          longitude: -73.9851,
          openingTime: "00:00",
          closingTime: "23:59",
          avatar: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=300&h=200&fit=crop"
        },
      }),
      prisma.vetClinic.upsert({
        where: { id: "clinic_003" },
        update: {},
        create: {
          id: "clinic_003",
          name: "Gentle Care Veterinary",
          address: "789 Care Lane, Pet City, PC 12347",
          phone: "+1555123458",
          email: "hello@gentlecare.vet",
          description: "Gentle and compassionate care for anxious pets. We specialize in fear-free veterinary visits.",
          rating: 4.9,
          latitude: 40.7505,
          longitude: -73.9934,
          openingTime: "09:00",
          closingTime: "17:00",
          avatar: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop"
        },
      }),
    ]);

    // Create veterinarians
    console.log("👩‍⚕️ Creating veterinarians...");
    const veterinarians = await Promise.all([
      prisma.veterinarian.upsert({
        where: { id: "vet_001" },
        update: {},
        create: {
          id: "vet_001",
          name: "Dr. Emily Smith",
          specialty: "General Practice",
          experience: 12,
          clinicId: vetClinics[0].id,
          avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face"
        },
      }),
      prisma.veterinarian.upsert({
        where: { id: "vet_002" },
        update: {},
        create: {
          id: "vet_002",
          name: "Dr. James Wilson",
          specialty: "Surgery",
          experience: 8,
          clinicId: vetClinics[0].id,
          avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face"
        },
      }),
      prisma.veterinarian.upsert({
        where: { id: "vet_003" },
        update: {},
        create: {
          id: "vet_003",
          name: "Dr. Sarah Johnson",
          specialty: "Cardiology",
          experience: 15,
          clinicId: vetClinics[1].id,
          avatar: "https://images.unsplash.com/photo-1582750433-7ccdc0dc5cdb?w=150&h=150&fit=crop&crop=face"
        },
      }),
      prisma.veterinarian.upsert({
        where: { id: "vet_004" },
        update: {},
        create: {
          id: "vet_004",
          name: "Dr. Michael Chen",
          specialty: "Dermatology",
          experience: 10,
          clinicId: vetClinics[2].id,
          avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&h=150&fit=crop&crop=face"
        },
      }),
    ]);

    // Create predefined service types (global catalog)
    console.log("🏥 Creating service types...");
    const serviceTypes = await Promise.all([
      prisma.serviceType.upsert({
        where: { name: "General Consultation" },
        update: {},
        create: {
          name: "General Consultation",
          description: "Comprehensive health examination and consultation with our experienced veterinarians",
          defaultDuration: 30,
          category: "Medical",
        },
      }),
      prisma.serviceType.upsert({
        where: { name: "Vaccination" },
        update: {},
        create: {
          name: "Vaccination",
          description: "Annual vaccinations and boosters to keep your pet protected",
          defaultDuration: 15,
          category: "Preventive Care",
        },
      }),
      prisma.serviceType.upsert({
        where: { name: "Dental Cleaning" },
        update: {},
        create: {
          name: "Dental Cleaning",
          description: "Professional dental cleaning and oral health check",
          defaultDuration: 60,
          category: "Wellness",
        },
      }),
      prisma.serviceType.upsert({
        where: { name: "Surgery Consultation" },
        update: {},
        create: {
          name: "Surgery Consultation",
          description: "Pre-surgical consultation and planning with our surgical team",
          defaultDuration: 45,
          category: "Medical",
        },
      }),
      prisma.serviceType.upsert({
        where: { name: "Emergency Care" },
        update: {},
        create: {
          name: "Emergency Care",
          description: "Urgent medical attention for emergencies - available 24/7",
          defaultDuration: 90,
          category: "Emergency",
        },
      }),
      prisma.serviceType.upsert({
        where: { name: "Grooming" },
        update: {},
        create: {
          name: "Grooming",
          description: "Professional grooming services including bath, haircut, and nail trimming",
          defaultDuration: 90,
          category: "Grooming",
        },
      }),
      prisma.serviceType.upsert({
        where: { name: "Spay/Neuter" },
        update: {},
        create: {
          name: "Spay/Neuter",
          description: "Safe and professional spay and neuter procedures",
          defaultDuration: 120,
          category: "Medical",
        },
      }),
      prisma.serviceType.upsert({
        where: { name: "X-Ray" },
        update: {},
        create: {
          name: "X-Ray",
          description: "Digital X-ray imaging for accurate diagnosis",
          defaultDuration: 30,
          category: "Diagnostic",
        },
      }),
    ]);

    // Assign services to clinics with custom pricing
    console.log("💉 Assigning services to clinics...");
    const clinicServices: any[] = [];

    // Happy Paws - offers all services
    const happyPawsServices = await Promise.all([
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[0].id,
          serviceTypeId: serviceTypes[0].id, // General Consultation
          price: 75.00,
          duration: 30,
        },
      }),
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[0].id,
          serviceTypeId: serviceTypes[1].id, // Vaccination
          price: 45.00,
          duration: 15,
        },
      }),
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[0].id,
          serviceTypeId: serviceTypes[2].id, // Dental Cleaning
          price: 120.00,
          duration: 60,
        },
      }),
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[0].id,
          serviceTypeId: serviceTypes[5].id, // Grooming
          price: 60.00,
          duration: 90,
        },
      }),
    ]);
    clinicServices.push(...happyPawsServices);

    // City Animal Hospital - emergency focused, higher prices
    const cityHospitalServices = await Promise.all([
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[1].id,
          serviceTypeId: serviceTypes[0].id, // General Consultation
          price: 85.00,
          duration: 30,
        },
      }),
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[1].id,
          serviceTypeId: serviceTypes[1].id, // Vaccination
          price: 50.00,
          duration: 15,
        },
      }),
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[1].id,
          serviceTypeId: serviceTypes[3].id, // Surgery Consultation
          price: 150.00,
          duration: 45,
        },
      }),
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[1].id,
          serviceTypeId: serviceTypes[4].id, // Emergency Care
          price: 200.00,
          duration: 90,
        },
      }),
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[1].id,
          serviceTypeId: serviceTypes[7].id, // X-Ray
          price: 100.00,
          duration: 30,
        },
      }),
    ]);
    clinicServices.push(...cityHospitalServices);

    // Gentle Care - wellness focused, competitive prices
    const gentleCareServices = await Promise.all([
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[2].id,
          serviceTypeId: serviceTypes[0].id, // General Consultation
          price: 70.00,
          duration: 30,
        },
      }),
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[2].id,
          serviceTypeId: serviceTypes[1].id, // Vaccination
          price: 40.00,
          duration: 15,
        },
      }),
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[2].id,
          serviceTypeId: serviceTypes[2].id, // Dental Cleaning
          price: 110.00,
          duration: 60,
        },
      }),
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[2].id,
          serviceTypeId: serviceTypes[5].id, // Grooming
          price: 55.00,
          duration: 90,
        },
      }),
      prisma.clinicService.create({
        data: {
          clinicId: vetClinics[2].id,
          serviceTypeId: serviceTypes[6].id, // Spay/Neuter
          price: 250.00,
          duration: 120,
        },
      }),
    ]);
    clinicServices.push(...gentleCareServices);

    // Create pets for the user
    console.log("🐾 Creating pets...");
    const pets = await Promise.all([
      prisma.pet.upsert({
        where: { id: "pet_001" },
        update: {},
        create: {
          id: "pet_001",
          name: "Buddy",
          species: "Dog",
          breed: "Golden Retriever",
          age: 3,
          weight: 28.5,
          userId: USER_ID,
          avatar: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=200&h=200&fit=crop"
        },
      }),
      prisma.pet.upsert({
        where: { id: "pet_002" },
        update: {},
        create: {
          id: "pet_002",
          name: "Luna",
          species: "Cat",
          breed: "Persian",
          age: 2,
          weight: 4.2,
          userId: USER_ID,
          avatar: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop"
        },
      }),
      prisma.pet.upsert({
        where: { id: "pet_003" },
        update: {},
        create: {
          id: "pet_003",
          name: "Charlie",
          species: "Dog",
          breed: "Labrador",
          age: 1,
          weight: 22.0,
          userId: USER_ID,
          avatar: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop"
        },
      }),
    ]);

    // Create appointments for the user
    console.log("📅 Creating appointments...");
    const appointments = await Promise.all([
      prisma.appointment.create({
        data: {
          startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          time: "10:00 AM",
          customerId: USER_ID,
          petId: pets[0].id,
          clinicId: vetClinics[0].id,
          veterinarianId: veterinarians[0].id,
          clinicServiceId: happyPawsServices[0].id, // General Consultation at Happy Paws
          notes: "Regular checkup for Buddy",
          status: "CONFIRMED",
        },
      }),
      prisma.appointment.create({
        data: {
          startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          time: "2:00 PM",
          customerId: USER_ID,
          petId: pets[1].id,
          clinicId: vetClinics[1].id,
          veterinarianId: veterinarians[2].id,
          clinicServiceId: cityHospitalServices[1].id, // Vaccination at City Hospital
          notes: "Vaccination for Luna",
          status: "scheduled",
        },
      }),
      prisma.appointment.create({
        data: {
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          time: "11:00 AM",
          customerId: USER_ID,
          petId: pets[2].id,
          clinicId: vetClinics[2].id,
          veterinarianId: veterinarians[3].id,
          clinicServiceId: gentleCareServices[0].id, // General Consultation at Gentle Care
          notes: "First checkup for Charlie",
          status: "completed",
        },
      }),
    ]);

    // Create a system user for sending messages
    console.log("💬 Creating system user for messages...");
    const systemUser = await prisma.user.upsert({
      where: { id: "system_clinic" },
      update: {},
      create: {
        id: "system_clinic",
        email: "system@clinic.com",
        firstName: "Clinic",
        lastName: "Team",
        role: "admin",
      },
    });

    // Create messages for the user
    console.log("💬 Creating messages...");
    await Promise.all([
      prisma.message.create({
        data: {
          content: "Your appointment for Buddy has been confirmed for tomorrow at 10:00 AM",
          senderId: systemUser.id,
          receiverId: USER_ID,
          appointmentId: appointments[0].id,
          read: false,
        },
      }),
      prisma.message.create({
        data: {
          content: "Reminder: Luna's vaccination is due this week. Please schedule an appointment.",
          senderId: systemUser.id,
          receiverId: USER_ID,
          read: false,
        },
      }),
      prisma.message.create({
        data: {
          content: "Thank you for choosing our clinic! Charlie did great during the checkup.",
          senderId: systemUser.id,
          receiverId: USER_ID,
          appointmentId: appointments[2].id,
          read: true,
        },
      }),
    ]);

    // Create articles
    console.log("📰 Creating articles...");
    await Promise.all([
      prisma.article.upsert({
        where: { id: "article_001" },
        update: {},
        create: {
          id: "article_001",
          title: "Top 10 Tips for Keeping Your Dog Healthy",
          content: "Regular exercise, proper nutrition, and routine vet checkups are essential for your dog's health. Here are our top 10 tips: 1) Daily exercise for at least 30 minutes, 2) Balanced diet with quality food, 3) Fresh water always available, 4) Regular vet checkups, 5) Dental care, 6) Grooming, 7) Mental stimulation, 8) Socialization, 9) Parasite prevention, 10) Lots of love and attention!",
          excerpt: "Essential tips for maintaining your dog's health and happiness",
          image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=250&fit=crop",
          category: "Pet Care",
          published: true,
          publishedAt: new Date(),
        },
      }),
      prisma.article.upsert({
        where: { id: "article_002" },
        update: {},
        create: {
          id: "article_002",
          title: "Understanding Cat Behavior: What Your Feline is Trying to Tell You",
          content: "Cats communicate through various behaviors and body language. Learning to understand these signals can help strengthen your bond with your feline friend. Purring usually means contentment, tail position indicates mood, and slow blinks are a sign of trust and affection.",
          excerpt: "Decode your cat's mysterious behaviors and strengthen your bond",
          image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=250&fit=crop",
          category: "Pet Behavior",
          published: true,
          publishedAt: new Date(),
        },
      }),
      prisma.article.upsert({
        where: { id: "article_003" },
        update: {},
        create: {
          id: "article_003",
          title: "Emergency First Aid for Pets: What Every Owner Should Know",
          content: "Knowing basic first aid for pets can save your furry friend's life in an emergency situation. Keep a pet first aid kit handy, know how to perform CPR on pets, recognize signs of choking, and always have your vet's emergency number ready.",
          excerpt: "Essential first aid knowledge that could save your pet's life",
          image: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400&h=250&fit=crop",
          category: "Health Tips",
          published: true,
          publishedAt: new Date(),
        },
      }),
      prisma.article.upsert({
        where: { id: "article_004" },
        update: {},
        create: {
          id: "article_004",
          title: "The Importance of Regular Dental Care for Pets",
          content: "Just like humans, pets need regular dental care to prevent gum disease, tooth decay, and other health problems. Brush your pet's teeth regularly, provide dental chews, and schedule professional cleanings.",
          excerpt: "Why dental health is crucial for your pet's overall wellbeing",
          image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=250&fit=crop",
          category: "Health Tips",
          published: true,
          publishedAt: new Date(),
        },
      }),
      prisma.article.upsert({
        where: { id: "article_005" },
        update: {},
        create: {
          id: "article_005",
          title: "Choosing the Right Food for Your Pet",
          content: "Proper nutrition is the foundation of pet health. Consider your pet's age, size, breed, and activity level when selecting food. Look for high-quality ingredients and consult your vet for personalized recommendations.",
          excerpt: "A comprehensive guide to selecting the best nutrition for your pet",
          image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=250&fit=crop",
          category: "Pet Care",
          published: true,
          publishedAt: new Date(),
        },
      }),
    ]);

    // Create promotions
    console.log("🎉 Creating promotions...");
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);

    await Promise.all([
      prisma.promotion.upsert({
        where: { id: "promo_001" },
        update: {},
        create: {
          id: "promo_001",
          title: "New Customer Discount",
          description: "Get 20% off your first visit! Book your appointment today.",
          image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop",
          discount: 20,
          validFrom: new Date(),
          validTo: futureDate,
          active: true,
        },
      }),
      prisma.promotion.upsert({
        where: { id: "promo_002" },
        update: {},
        create: {
          id: "promo_002",
          title: "Vaccination Package Deal",
          description: "Complete vaccination package at 15% off - protect your pet and save!",
          image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=300&h=200&fit=crop",
          discount: 15,
          validFrom: new Date(),
          validTo: futureDate,
          active: true,
        },
      }),
      prisma.promotion.upsert({
        where: { id: "promo_003" },
        update: {},
        create: {
          id: "promo_003",
          title: "Summer Grooming Special",
          description: "Keep your pet cool this summer! 25% off all grooming services.",
          image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300&h=200&fit=crop",
          discount: 25,
          validFrom: new Date(),
          validTo: futureDate,
          active: true,
        },
      }),
    ]);

    console.log("✅ User data seeded successfully!");
    console.log(`🏥 Created ${vetClinics.length} vet clinics`);
    console.log(`👩‍⚕️ Created ${veterinarians.length} veterinarians`);
    console.log(`📋 Created ${serviceTypes.length} service types`);
    console.log(`💉 Created ${clinicServices.length} clinic services (services assigned to clinics)`);
    console.log(`🐾 Created ${pets.length} pets`);
    console.log(`📅 Created ${appointments.length} appointments`);
    console.log("💬 Created 3 messages");
    console.log("📰 Created 5 articles");
    console.log("🎉 Created 3 promotions");

  } catch (error) {
    console.error("❌ Error seeding user data:", error);
    throw error;
  }
}

async function main() {
  try {
    await seedUserData();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
