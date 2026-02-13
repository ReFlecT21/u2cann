#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedMobileApp() {
  try {
    console.log("🌱 Seeding mobile app data...");

    // Clear existing data (optional - comment out to preserve existing data)
    console.log("🧹 Clearing existing data...");
    await prisma.appointment.deleteMany();
    await prisma.timeSlot.deleteMany();
    await prisma.service.deleteMany();
    await prisma.veterinarian.deleteMany();
    await prisma.vetClinic.deleteMany();
    await prisma.pet.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.review.deleteMany();
    await prisma.message.deleteMany();
    await prisma.article.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.user.deleteMany({ where: { role: 'customer' } });

    // Create customer users
    console.log("👥 Creating customer users...");
    const customers = await Promise.all([
      prisma.user.upsert({
        where: { id: "user_33gVxw7OOmrIMTdAQWcwCyazMqw" },
        update: {},
        create: {
          id: "user_33gVxw7OOmrIMTdAQWcwCyazMqw",
          email: "john.doe@example.com",
          firstName: "John",
          lastName: "Doe",
          phone: "+1234567890",
          role: "customer",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
        },
      }),
      prisma.user.upsert({
        where: { id: "user_123456790" },
        update: {},
        create: {
          id: "user_123456790",
          email: "sarah.wilson@example.com",
          firstName: "Sarah",
          lastName: "Wilson",
          phone: "+1234567891",
          role: "customer",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
        },
      }),
      prisma.user.upsert({
        where: { id: "user_123456791" },
        update: {},
        create: {
          id: "user_123456791",
          email: "mike.chen@example.com",
          firstName: "Mike",
          lastName: "Chen",
          phone: "+1234567892",
          role: "customer",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
        },
      }),
    ]);

    // Create vet clinics
    console.log("🏥 Creating vet clinics...");
    const vetClinics = await Promise.all([
      prisma.vetClinic.create({
        data: {
          name: "Happy Paws Veterinary Clinic",
          address: "123 Pet Street, Pet City, PC 12345",
          phone: "+1555123456",
          email: "info@happypaws.com",
          description: "Comprehensive veterinary care for all your pets",
          rating: 4.8,
          latitude: 40.7128,
          longitude: -74.0060,
          openingTime: "08:00",
          closingTime: "18:00",
          avatar: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=300&h=200&fit=crop"
        },
      }),
      prisma.vetClinic.create({
        data: {
          name: "City Animal Hospital",
          address: "456 Animal Avenue, Pet City, PC 12346",
          phone: "+1555123457",
          email: "contact@cityanimalhospital.com",
          description: "24/7 emergency care and specialized treatments",
          rating: 4.6,
          latitude: 40.7589,
          longitude: -73.9851,
          openingTime: "00:00",
          closingTime: "23:59",
          avatar: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=300&h=200&fit=crop"
        },
      }),
      prisma.vetClinic.create({
        data: {
          name: "Gentle Care Veterinary",
          address: "789 Care Lane, Pet City, PC 12347",
          phone: "+1555123458",
          email: "hello@gentlecare.vet",
          description: "Gentle and compassionate care for anxious pets",
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
    const veterinarians = [];
    for (const clinic of vetClinics) {
      const clinicVets = await Promise.all([
        prisma.veterinarian.create({
          data: {
            name: `Dr. ${Math.random() > 0.5 ? 'Emily' : 'James'} ${['Smith', 'Johnson', 'Brown'][Math.floor(Math.random() * 3)]}`,
            specialty: "General Practice",
            experience: Math.floor(Math.random() * 15) + 5,
            clinicId: clinic.id,
            avatar: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1559839734-2b71ea197ec2' : '1612349317150-e413f6a5b16d'}?w=150&h=150&fit=crop&crop=face`
          },
        }),
        prisma.veterinarian.create({
          data: {
            name: `Dr. ${Math.random() > 0.5 ? 'Sarah' : 'Michael'} ${['Davis', 'Wilson', 'Garcia'][Math.floor(Math.random() * 3)]}`,
            specialty: "Surgery",
            experience: Math.floor(Math.random() * 10) + 3,
            clinicId: clinic.id,
            avatar: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1582750433-7ccdc0dc5cdb' : '1612349317150-e413f6a5b16d'}?w=150&h=150&fit=crop&crop=face`
          },
        }),
      ]);
      veterinarians.push(...clinicVets);
    }

    // Create services
    console.log("💉 Creating services...");
    const services = [];
    for (const clinic of vetClinics) {
      const clinicServices = await Promise.all([
        prisma.service.create({
          data: {
            name: "General Consultation",
            description: "Comprehensive health examination and consultation",
            price: 75.00,
            duration: 30,
            clinicId: clinic.id,
          },
        }),
        prisma.service.create({
          data: {
            name: "Vaccination",
            description: "Annual vaccinations and boosters",
            price: 45.00,
            duration: 15,
            clinicId: clinic.id,
          },
        }),
        prisma.service.create({
          data: {
            name: "Dental Cleaning",
            description: "Professional dental cleaning and oral health check",
            price: 120.00,
            duration: 60,
            clinicId: clinic.id,
          },
        }),
        prisma.service.create({
          data: {
            name: "Surgery Consultation",
            description: "Pre-surgical consultation and planning",
            price: 150.00,
            duration: 45,
            clinicId: clinic.id,
          },
        }),
        prisma.service.create({
          data: {
            name: "Emergency Care",
            description: "Urgent medical attention for emergencies",
            price: 200.00,
            duration: 90,
            clinicId: clinic.id,
          },
        }),
      ]);
      services.push(...clinicServices);
    }

    // Create pets
    console.log("🐕 Creating pets...");
    const petNames = {
      Dog: ["Buddy", "Charlie", "Max", "Bella", "Luna", "Cooper", "Sadie"],
      Cat: ["Whiskers", "Shadow", "Mittens", "Tiger", "Princess", "Oliver", "Chloe"],
      Rabbit: ["Snowball", "Cocoa", "Pepper", "Honey", "Nibbles"],
      Bird: ["Tweety", "Blue", "Sunny", "Kiwi", "Rio"]
    };

    const petBreeds = {
      Dog: ["Golden Retriever", "Labrador", "German Shepherd", "Poodle", "Bulldog"],
      Cat: ["Persian", "Siamese", "Maine Coon", "British Shorthair", "Ragdoll"],
      Rabbit: ["Holland Lop", "Mini Rex", "Netherland Dwarf", "Lionhead"],
      Bird: ["Parakeet", "Canary", "Cockatiel", "Lovebird"]
    };

    const pets = [];
    for (const customer of customers) {
      const numPets = Math.floor(Math.random() * 3) + 1; // 1-3 pets per customer

      for (let i = 0; i < numPets; i++) {
        const species = Object.keys(petNames)[Math.floor(Math.random() * Object.keys(petNames).length)] as keyof typeof petNames;
        const name = petNames[species][Math.floor(Math.random() * petNames[species].length)];
        const breed = petBreeds[species][Math.floor(Math.random() * petBreeds[species].length)];

        const pet = await prisma.pet.create({
          data: {
            name,
            species,
            breed,
            age: Math.floor(Math.random() * 15) + 1,
            weight: species === "Dog" ? Math.random() * 40 + 10 :
                   species === "Cat" ? Math.random() * 8 + 3 :
                   species === "Rabbit" ? Math.random() * 3 + 1 :
                   Math.random() * 0.5 + 0.1,
            userId: customer.id,
            avatar: `https://images.unsplash.com/photo-${species === 'Dog' ? '1551717042-33e5fd56bd8' :
                     species === 'Cat' ? '1574158622-7af2c168d1a' :
                     species === 'Rabbit' ? '1585110396-b72378e7c7f2' :
                     '1520637836862-4d197d17c13a'}?w=200&h=200&fit=crop`
          },
        });
        pets.push(pet);
      }
    }

    // Create time slots
    console.log("⏰ Creating time slots...");
    const timeSlots = [];
    for (const clinic of vetClinics) {
      const today = new Date();
      const timeSlotData = [];

      // Create slots for next 7 days
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() + day);

        // Morning slots
        for (let hour = 9; hour < 12; hour++) {
          timeSlotData.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            period: "Morning",
            available: Math.random() > 0.3, // 70% chance available
            date,
            clinicId: clinic.id,
          });

          timeSlotData.push({
            time: `${hour.toString().padStart(2, '0')}:30`,
            period: "Morning",
            available: Math.random() > 0.3,
            date,
            clinicId: clinic.id,
          });
        }

        // Afternoon slots
        for (let hour = 14; hour < 17; hour++) {
          timeSlotData.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            period: "Afternoon",
            available: Math.random() > 0.3,
            date,
            clinicId: clinic.id,
          });

          timeSlotData.push({
            time: `${hour.toString().padStart(2, '0')}:30`,
            period: "Afternoon",
            available: Math.random() > 0.3,
            date,
            clinicId: clinic.id,
          });
        }
      }

      const clinicSlots = await prisma.timeSlot.createMany({
        data: timeSlotData,
      });
      timeSlots.push(clinicSlots);
    }

    // Create some appointments
    console.log("📅 Creating sample appointments...");
    const appointments = [];
    for (let i = 0; i < 10; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const customerPets = pets.filter(pet => pet.userId === customer.id);

      if (customerPets.length === 0) continue;

      const pet = customerPets[Math.floor(Math.random() * customerPets.length)];
      const clinic = vetClinics[Math.floor(Math.random() * vetClinics.length)];
      const veterinarian = veterinarians.filter(vet => vet.clinicId === clinic.id)[0];
      const service = services.filter(svc => svc.clinicId === clinic.id)[0];

      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 7));

      const appointment = await prisma.appointment.create({
        data: {
          startTime: appointmentDate,
          endTime: new Date(appointmentDate.getTime() + 60 * 60 * 1000), // 1 hour later
          date: appointmentDate,
          time: "10:00",
          customerId: customer.id,
          petId: pet.id,
          clinicId: clinic.id,
          veterinarianId: veterinarian.id,
          serviceId: service.id,
          notes: `Regular checkup for ${pet.name}`,
          status: ["scheduled", "CONFIRMED", "PENDING"][Math.floor(Math.random() * 3)] as any,
        },
      });
      appointments.push(appointment);
    }

    // Create articles
    console.log("📰 Creating articles...");
    await Promise.all([
      prisma.article.create({
        data: {
          title: "Top 10 Tips for Keeping Your Dog Healthy",
          content: "Regular exercise, proper nutrition, and routine vet checkups are essential for your dog's health...",
          excerpt: "Essential tips for maintaining your dog's health and happiness",
          image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=250&fit=crop",
          category: "Pet Care",
          published: true,
          publishedAt: new Date(),
        },
      }),
      prisma.article.create({
        data: {
          title: "Understanding Cat Behavior: What Your Feline is Trying to Tell You",
          content: "Cats communicate through various behaviors and body language. Learning to understand these signals...",
          excerpt: "Decode your cat's mysterious behaviors and strengthen your bond",
          image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=250&fit=crop",
          category: "Pet Behavior",
          published: true,
          publishedAt: new Date(),
        },
      }),
      prisma.article.create({
        data: {
          title: "Emergency First Aid for Pets: What Every Owner Should Know",
          content: "Knowing basic first aid for pets can save your furry friend's life in an emergency situation...",
          excerpt: "Essential first aid knowledge that could save your pet's life",
          image: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400&h=250&fit=crop",
          category: "Health Tips",
          published: true,
          publishedAt: new Date(),
        },
      }),
    ]);

    // Create promotions
    console.log("🎉 Creating promotions...");
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);

    await Promise.all([
      prisma.promotion.create({
        data: {
          title: "New Customer Discount",
          description: "Get 20% off your first visit!",
          image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop",
          discount: 20,
          validFrom: new Date(),
          validTo: futureDate,
          active: true,
        },
      }),
      prisma.promotion.create({
        data: {
          title: "Vaccination Package Deal",
          description: "Complete vaccination package at discounted rates",
          image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=300&h=200&fit=crop",
          discount: 15,
          validFrom: new Date(),
          validTo: futureDate,
          active: true,
        },
      }),
    ]);

    // Create pets for the specific user (user_31aWvdIFddf6KLdgqbDNgjFFjaP)
    console.log("🐾 Creating pets for user_31aWvdIFddf6KLdgqbDNgjFFjaP...");
    const specificUserPets = await Promise.all([
      prisma.pet.create({
        data: {
          name: "Buddy",
          species: "Dog",
          breed: "Golden Retriever",
          age: 3,
          weight: 25.5,
          userId: "user_31aWvdIFddf6KLdgqbDNgjFFjaP",
          avatar: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop"
        },
      }),
      prisma.pet.create({
        data: {
          name: "Whiskers",
          species: "Cat",
          breed: "Persian",
          age: 2,
          weight: 4.2,
          userId: "user_31aWvdIFddf6KLdgqbDNgjFFjaP",
          avatar: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop"
        },
      }),
      prisma.pet.create({
        data: {
          name: "Luna",
          species: "Dog",
          breed: "Labrador",
          age: 1,
          weight: 15.0,
          userId: "user_31aWvdIFddf6KLdgqbDNgjFFjaP",
          avatar: "https://images.unsplash.com/photo-1551717042-33e5fd56bd8?w=200&h=200&fit=crop"
        },
      }),
    ]);

    console.log("✅ Mobile app seed data created successfully!");
    console.log(`👥 Created ${customers.length} customers`);
    console.log(`🏥 Created ${vetClinics.length} vet clinics`);
    console.log(`👩‍⚕️ Created ${veterinarians.length} veterinarians`);
    console.log(`💉 Created ${services.length} services`);
    console.log(`🐕 Created ${pets.length} pets`);
    console.log(`🐾 Created ${specificUserPets.length} pets for specific user`);
    console.log(`📅 Created ${appointments.length} appointments`);
    console.log("📰 Created 3 articles");
    console.log("🎉 Created 2 promotions");

  } catch (error) {
    console.error("❌ Error seeding mobile app data:", error);
    throw error;
  }
}

async function seedMembershipPlans() {
  console.log("🏋️ Seeding membership plans...");

  const plans = [
    // ===== FREE TRIAL =====
    {
      planType: "FREE_TRIAL",
      category: "TRIAL",
      name: "Free Trial",
      stripePriceId: null,
      stripeProductId: "prod_Tft8gngNNnwXQ8",
      sessionsIncluded: 1,
      commitmentMonths: null,
      priceInCents: 0,
    },

    // ===== TRIAL CLASS =====
    {
      planType: "TRIAL_CLASS",
      category: "TRIAL",
      name: "Trial Class",
      stripePriceId: null,
      stripeProductId: "prod_TnPx5MPbWLtVH4",
      sessionsIncluded: 1,
      commitmentMonths: null,
      priceInCents: 1000,
    },

    // ===== FLEXI PACKAGES =====
    {
      planType: "FLEXI_ADULT_10",
      category: "FLEXI_PACKAGE",
      name: "Adult Flexi Package - 10 Sessions",
      stripePriceId: null,
      stripeProductId: "prod_Tft2CsejysdWjx",
      sessionsIncluded: 10,
      commitmentMonths: null,
      priceInCents: 35000,
    },
    {
      planType: "FLEXI_ADULT_5",
      category: "FLEXI_PACKAGE",
      name: "Adult Flexi Package - 5 Sessions",
      stripePriceId: null,
      stripeProductId: "prod_Tft1S6AbMv17fS",
      sessionsIncluded: 5,
      commitmentMonths: null,
      priceInCents: 20500,
    },
    {
      planType: "FLEXI_YOUTH_10",
      category: "FLEXI_PACKAGE",
      name: "Youth Flexi Package - 10 Sessions",
      stripePriceId: null,
      stripeProductId: "prod_Tft0i8C9ENKL4y",
      sessionsIncluded: 10,
      commitmentMonths: null,
      priceInCents: 35000,
    },
    {
      planType: "FLEXI_YOUTH_5",
      category: "FLEXI_PACKAGE",
      name: "Youth Flexi Package - 5 Sessions",
      stripePriceId: null,
      stripeProductId: "prod_TfszCQ0nQPkdCC",
      sessionsIncluded: 5,
      commitmentMonths: null,
      priceInCents: 20500,
    },
    {
      planType: "FLEXI_JUNIOR_10",
      category: "FLEXI_PACKAGE",
      name: "Junior Flexi Package - 10 Sessions",
      stripePriceId: null,
      stripeProductId: "prod_Tfsyu52WUS3VDX",
      sessionsIncluded: 10,
      commitmentMonths: null,
      priceInCents: 28500,
    },
    {
      planType: "FLEXI_JUNIOR_5",
      category: "FLEXI_PACKAGE",
      name: "Junior Flexi Package - 5 Sessions",
      stripePriceId: null,
      stripeProductId: "prod_TfsyXTkjC3Xgo9",
      sessionsIncluded: 5,
      commitmentMonths: null,
      priceInCents: 15000,
    },

    // ===== MONTHLY MEMBERSHIPS - ADULT =====
    {
      planType: "MONTHLY_ADULT_1YR",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Adults Monthly Membership - 1 Year",
      stripePriceId: null,
      stripeProductId: "prod_TfsnoM0t71J5zO",
      sessionsIncluded: null,
      commitmentMonths: 12,
      priceInCents: 17500,
    },
    {
      planType: "MONTHLY_ADULT_1YR_DEPRECATED",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Adults Monthly Membership - 12 Months (Deprecated)",
      stripePriceId: null,
      stripeProductId: "prod_TyJEKUH4wvPRcK",
      sessionsIncluded: null,
      commitmentMonths: 12,
      priceInCents: 17500,
    },
    {
      planType: "MONTHLY_ADULT_6MO",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Adults Monthly Membership - 6 Months",
      stripePriceId: null,
      stripeProductId: "prod_TfsledpOQsyR7S",
      sessionsIncluded: null,
      commitmentMonths: 6,
      priceInCents: 19200,
    },
    {
      planType: "MONTHLY_ADULT_3MO",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Adults Monthly Membership - 3 Months",
      stripePriceId: null,
      stripeProductId: "prod_Tfsj2Oe4cINuX5",
      sessionsIncluded: null,
      commitmentMonths: 3,
      priceInCents: 20900,
    },
    {
      planType: "MONTHLY_ADULT",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Adults Monthly Membership",
      stripePriceId: null,
      stripeProductId: "prod_Tfsj889ZSsjPcn",
      sessionsIncluded: null,
      commitmentMonths: 1,
      priceInCents: 22300,
    },

    // ===== MONTHLY MEMBERSHIPS - STUDENT =====
    {
      planType: "MONTHLY_STUDENT_1YR",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Student Monthly Membership - 1 Year",
      stripePriceId: null,
      stripeProductId: "prod_Tfsb4Pk9Ep6B5e",
      sessionsIncluded: null,
      commitmentMonths: 12,
      priceInCents: 9800,
    },
    {
      planType: "MONTHLY_STUDENT_6MO",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Student Monthly Membership - 6 Months",
      stripePriceId: null,
      stripeProductId: "prod_TfsaOxO2uHh3NE",
      sessionsIncluded: null,
      commitmentMonths: 6,
      priceInCents: 10900,
    },
    {
      planType: "MONTHLY_STUDENT_3MO",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Student Monthly Membership - 3 Months",
      stripePriceId: null,
      stripeProductId: "prod_TfsaaRAijAzAzV",
      sessionsIncluded: null,
      commitmentMonths: 3,
      priceInCents: 11700,
    },
    {
      planType: "MONTHLY_STUDENT",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Student Monthly Membership",
      stripePriceId: null,
      stripeProductId: "prod_TfsIKwWxa9klZT",
      sessionsIncluded: null,
      commitmentMonths: 1,
      priceInCents: 13200,
    },

    // ===== MONTHLY MEMBERSHIPS - NSF/NSMEN =====
    {
      planType: "MONTHLY_NSF_1YR",
      category: "MONTHLY_SUBSCRIPTION",
      name: "NSF/NSMEN Monthly Membership - 1 Year",
      stripePriceId: null,
      stripeProductId: "prod_TfsfHuMMI3SNVh",
      sessionsIncluded: null,
      commitmentMonths: 12,
      priceInCents: 15800,
    },
    {
      planType: "MONTHLY_NSF_6MO",
      category: "MONTHLY_SUBSCRIPTION",
      name: "NSF/NSMEN Monthly Membership - 6 Months",
      stripePriceId: null,
      stripeProductId: "prod_TfsfXRdTQbgMeS",
      sessionsIncluded: null,
      commitmentMonths: 6,
      priceInCents: 17500,
    },
    {
      planType: "MONTHLY_NSF_3MO",
      category: "MONTHLY_SUBSCRIPTION",
      name: "NSF/NSMEN Monthly Membership - 3 Months",
      stripePriceId: null,
      stripeProductId: "prod_TfseuoXMJeNVw9",
      sessionsIncluded: null,
      commitmentMonths: 3,
      priceInCents: 19200,
    },
    {
      planType: "MONTHLY_NSF",
      category: "MONTHLY_SUBSCRIPTION",
      name: "NSF/NSMEN Monthly Membership",
      stripePriceId: null,
      stripeProductId: "prod_TfscqLfFIbrfGO",
      sessionsIncluded: null,
      commitmentMonths: 1,
      priceInCents: 21400,
    },

    // ===== MONTHLY MEMBERSHIPS - JUNIOR =====
    {
      planType: "MONTHLY_JUNIOR_1YR",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Junior Monthly Membership - 1 Year",
      stripePriceId: null,
      stripeProductId: "prod_TfsEQ8mhmKAzjF",
      sessionsIncluded: null,
      commitmentMonths: 12,
      priceInCents: 7600,
    },
    {
      planType: "MONTHLY_JUNIOR_6MO",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Junior Monthly Membership - 6 Months",
      stripePriceId: null,
      stripeProductId: "prod_TfXOx3GdvRh6z3",
      sessionsIncluded: null,
      commitmentMonths: 6,
      priceInCents: 8400,
    },
    {
      planType: "MONTHLY_JUNIOR_3MO",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Junior Monthly Membership - 3 Months",
      stripePriceId: null,
      stripeProductId: "prod_TfXN1aF7mLXpEr",
      sessionsIncluded: null,
      commitmentMonths: 3,
      priceInCents: 9300,
    },
    {
      planType: "MONTHLY_JUNIOR",
      category: "MONTHLY_SUBSCRIPTION",
      name: "Junior Monthly Membership",
      stripePriceId: null,
      stripeProductId: "prod_TfXMQvCD2rNgwc",
      sessionsIncluded: null,
      commitmentMonths: 1,
      priceInCents: 10800,
    },
  ] as const;

  for (const plan of plans) {
    // Use product ID as placeholder for price ID (will be updated by webhook when actual price is used)
    const stripePriceId = `price_placeholder_${plan.planType}`;

    await prisma.membershipPlan.upsert({
      where: { planType: plan.planType },
      update: {
        name: plan.name,
        category: plan.category,
        stripeProductId: plan.stripeProductId,
        sessionsIncluded: plan.sessionsIncluded,
        commitmentMonths: plan.commitmentMonths,
        priceInCents: plan.priceInCents,
      },
      create: {
        planType: plan.planType,
        name: plan.name,
        category: plan.category,
        stripePriceId,
        stripeProductId: plan.stripeProductId,
        sessionsIncluded: plan.sessionsIncluded,
        commitmentMonths: plan.commitmentMonths,
        priceInCents: plan.priceInCents,
      },
    });
  }

  console.log(`✅ Seeded ${plans.length} membership plans`);
}

async function main() {
  try {
    // Seed membership plans (safe to run - uses upsert)
    await seedMembershipPlans();

    // Uncomment below to also seed mobile app data
    // await seedMobileApp();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();