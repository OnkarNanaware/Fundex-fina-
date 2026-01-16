// Quick script to check if the user exists
// Run this in MongoDB shell or Compass

// Check if user with this ID exists
db.users.findOne({ _id: ObjectId("68b095ddcdc4e62f14712363") })

// If user exists, check what fields it has
db.users.findOne(
    { _id: ObjectId("68b095ddcdc4e62f14712363") },
    {
        _id: 1,
        email: 1,
        role: 1,
        fullName: 1,
        donorFirstName: 1,
        donorLastName: 1,
        ngoName: 1
    }
)
