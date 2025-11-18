const Notification = require('../models/Notification');
const JobItem = require('../models/JobItem');
const JobHome = require('../models/JobHome');
const JobCard = require('../models/JobCard');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const Item = require('../models/Item');

const getNotifications = async (req, res) => {
  try {
    await createNotificationsForExpiringItems();

    const notifications = await Notification.aggregate([
      {
        $match: { is_deleted: false }
      },
      {
        $lookup: {
          from: 'jobitems',
          localField: 'job_item_id',
          foreignField: '_id',
          as: 'jobItem'
        }
      },
      { $unwind: '$jobItem' },
      {
        $lookup: {
          from: 'jobhomes',
          localField: 'jobItem.job_home_id',
          foreignField: '_id',
          as: 'jobHome'
        }
      },
      { $unwind: '$jobHome' },
      {
        $lookup: {
          from: 'jobcards',
          localField: 'jobHome._id',
          foreignField: 'job_home_id',
          as: 'jobCard'
        }
      },
      { $unwind: '$jobCard' },
      {
        $lookup: {
          from: 'quotations',
          localField: 'jobCard._id',
          foreignField: 'job_card_id',
          as: 'quotation'
        }
      },
      { $unwind: '$quotation' },
      {
        $lookup: {
          from: 'invoices',
          localField: 'quotation._id',
          foreignField: 'quotation_id',
          as: 'invoice'
        }
      },
      { $unwind: '$invoice' },
      {
        $lookup: {
          from: 'items',
          localField: 'jobItem.materials_no',
          foreignField: '_id',
          as: 'item'
        }
      },
      { $unwind: '$item' },
      {
        $project: {
          id: '$_id',
          is_read: 1,
          created_at: 1,
          job_home_id: '$jobHome._id',
          job_no: '$jobHome.job_no',
          customer_name: '$jobCard.customer_name',
          item_name: '$item.name',
          service_timeout: '$item.service_timeout',
          invoice_date: '$invoice.invoice_date',
          expiry_date: {
            $dateAdd: {
              startDate: '$invoice.invoice_date',
              unit: 'day',
              amount: '$item.service_timeout'
            }
          },
          days_remaining: {
            $floor: {
              $divide: [
                {
                  $subtract: [
                    { $dateAdd: { startDate: '$invoice.invoice_date', unit: 'day', amount: '$item.service_timeout' } },
                    new Date()
                  ]
                },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $match: {
          days_remaining: { $gte: 0, $lte: 5 }
        }
      },
      {
        $sort: { days_remaining: 1 }
      }
    ]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json({
      notifications,
      count: unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createNotificationsForExpiringItems = async () => {
  try {
    const expiringItems = await JobItem.aggregate([
      {
        $lookup: {
          from: 'items',
          localField: 'materials_no',
          foreignField: '_id',
          as: 'item'
        }
      },
      { $unwind: '$item' },
      {
        $lookup: {
          from: 'jobhomes',
          localField: 'job_home_id',
          foreignField: '_id',
          as: 'jobHome'
        }
      },
      { $unwind: '$jobHome' },
      {
        $lookup: {
          from: 'jobcards',
          localField: 'jobHome._id',
          foreignField: 'job_home_id',
          as: 'jobCard'
        }
      },
      { $unwind: '$jobCard' },
      {
        $lookup: {
          from: 'quotations',
          localField: 'jobCard._id',
          foreignField: 'job_card_id',
          as: 'quotation'
        }
      },
      { $unwind: '$quotation' },
      {
        $lookup: {
          from: 'invoices',
          localField: 'quotation._id',
          foreignField: 'quotation_id',
          as: 'invoice'
        }
      },
      { $unwind: '$invoice' },
      {
        $lookup: {
          from: 'notifications',
          localField: '_id',
          foreignField: 'job_item_id',
          as: 'notification'
        }
      },
      {
        $match: {
          notification: { $size: 0 },
          $expr: {
            $and: [
              {
                $lte: [
                  {
                    $floor: {
                      $divide: [
                        {
                          $subtract: [
                            { $dateAdd: { startDate: '$invoice.invoice_date', unit: 'day', amount: '$item.service_timeout' } },
                            new Date()
                          ]
                        },
                        1000 * 60 * 60 * 24
                      ]
                    }
                  },
                  5
                ]
              },
              {
                $gte: [
                  {
                    $floor: {
                      $divide: [
                        {
                          $subtract: [
                            { $dateAdd: { startDate: '$invoice.invoice_date', unit: 'day', amount: '$item.service_timeout' } },
                            new Date()
                          ]
                        },
                        1000 * 60 * 60 * 24
                      ]
                    }
                  },
                  0
                ]
              }
            ]
          }
        }
      },
      {
        $project: { _id: 1 }
      }
    ]);

    for (const item of expiringItems) {
      await Notification.create({
        job_item_id: item._id,
        is_read: false,
        is_deleted: false,
      });
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { is_read: true });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { is_deleted: true });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
