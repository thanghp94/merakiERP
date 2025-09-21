import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, withTeacherOrAdmin } from '../../../lib/auth/rbac';
import { COLLECTIONS, getTimestamp } from '../../../lib/firebase-admin';

// GET /api/facilities - Get all facilities
const getFacilities = withAuth(async (req, res, { user, db }) => {
  try {
    const snapshot = await db.collection(COLLECTIONS.FACILITIES)
      .orderBy('created_at', 'desc')
      .get();

    const facilities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({
      success: true,
      data: facilities,
      message: 'Facilities retrieved successfully'
    });

  } catch (error) {
    console.error('Get facilities error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve facilities'
    });
  }
});

// POST /api/facilities - Create facility (Teachers/Admins only)
const createFacility = withTeacherOrAdmin(async (req, res, { user, db }) => {
  const { name, status = 'active', data = {} } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Facility name is required'
    });
  }

  try {
    const newFacility = {
      name,
      status,
      data,
      created_at: getTimestamp(),
      updated_at: getTimestamp()
    };

    const docRef = await db.collection(COLLECTIONS.FACILITIES).add(newFacility);
    const createdFacility = { id: docRef.id, ...newFacility };

    return res.status(201).json({
      success: true,
      data: createdFacility,
      message: 'Facility created successfully'
    });

  } catch (error) {
    console.error('Create facility error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create facility'
    });
  }
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getFacilities(req, res);
    case 'POST':
      return createFacility(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ 
        success: false, 
        message: `Method ${req.method} not allowed` 
      });
  }
}