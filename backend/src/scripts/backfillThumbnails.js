/**
 * backfillThumbnails.js
 *
 * Links existing gallery images to the 300x300 thumbnails that were already
 * generated and stored in GridFS at upload time but never recorded on the
 * gallery document.
 *
 * Every thumbnail was tagged by imageController.js with:
 *     metadata: { isThumbnail: true, parentImageId: <original image _id> }
 * so nothing needs to be re-uploaded; the link can be reconstructed.
 *
 * USAGE
 *     cd backend
 *     node src/scripts/backfillThumbnails.js            # DRY RUN, writes nothing
 *     node src/scripts/backfillThumbnails.js --apply    # actually writes
 *
 * SAFETY PROPERTIES
 *  - Dry run by default. Writing requires an explicit --apply.
 *  - Additive only. Sets `thumbnailId` where it is absent or null; never
 *    deletes, never overwrites an existing value, never touches another field.
 *  - Idempotent. A second run finds nothing left to link and reports 0.
 *  - Uses a targeted $set through the raw driver rather than doc.save().
 *    This is deliberate: `imageInGallerySchema` declares `default: 0` on both
 *    `order` and `rotation`, and mongoose writes schema defaults back to the
 *    document on save. A save() here could therefore stamp order/rotation onto
 *    image subdocuments that currently lack them, silently reordering a
 *    gallery. $set on a single path cannot do that.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Gallery } from '../models/index.js';
import connectDB from '../config/database.js';

dotenv.config();

const APPLY = process.argv.includes('--apply');

const backfillThumbnails = async () => {
  await connectDB();

  console.log('');
  console.log('='.repeat(70));
  console.log(APPLY ? '  BACKFILL THUMBNAILS — APPLY (will write)' : '  BACKFILL THUMBNAILS — DRY RUN (writes nothing)');
  console.log('='.repeat(70));
  console.log('');

  // ---------------------------------------------------------------------
  // 1. Map every thumbnail back to the image it was generated from.
  //    Bucket name is "images", so the files collection is `images.files`.
  // ---------------------------------------------------------------------
  const filesCollection = mongoose.connection.db.collection('images.files');

  const thumbnails = await filesCollection
    .find(
      { 'metadata.isThumbnail': true },
      { projection: { _id: 1, 'metadata.parentImageId': 1 } }
    )
    .toArray();

  // Keyed by STRING. ObjectIds are objects, so === between two of them is
  // always false even when they represent the same id.
  const thumbByParent = new Map();
  for (const thumb of thumbnails) {
    const parentId = thumb.metadata?.parentImageId;
    if (!parentId) continue;
    thumbByParent.set(String(parentId), thumb._id);
  }

  console.log(`Thumbnails in GridFS      : ${thumbnails.length}`);
  console.log(`  ...with a parentImageId : ${thumbByParent.size}`);
  console.log('');

  // ---------------------------------------------------------------------
  // 2. Walk every gallery and work out what needs linking.
  // ---------------------------------------------------------------------
  const galleries = await Gallery.find({}).lean();

  let totalImages = 0;
  let alreadyLinked = 0;
  let willLink = 0;
  let noThumbnailFound = 0;

  const operations = [];

  console.log('Per gallery:');
  console.log(`  ${'name'.padEnd(16)} ${'images'.padStart(6)} ${'linked'.padStart(6)} ${'to link'.padStart(7)} ${'missing'.padStart(7)}`);
  console.log(`  ${'-'.repeat(16)} ${'-'.repeat(6)} ${'-'.repeat(6)} ${'-'.repeat(7)} ${'-'.repeat(7)}`);

  for (const gallery of galleries) {
    const images = gallery.images || [];
    let gLinked = 0;
    let gToLink = 0;
    let gMissing = 0;

    images.forEach((image, index) => {
      totalImages++;

      if (image.thumbnailId) {
        alreadyLinked++;
        gLinked++;
        return;
      }

      const thumbnailId = thumbByParent.get(String(image.imageId));

      if (!thumbnailId) {
        noThumbnailFound++;
        gMissing++;
        return;
      }

      willLink++;
      gToLink++;

      // Guard on imageId at this index so we can only ever write to the
      // element we actually inspected, and on thumbnailId being absent/null
      // so a concurrent write can never be overwritten. { $in: [null] }
      // matches both an explicit null and a missing field.
      operations.push({
        updateOne: {
          filter: {
            _id: gallery._id,
            [`images.${index}.imageId`]: image.imageId,
            [`images.${index}.thumbnailId`]: { $in: [null] }
          },
          update: {
            $set: { [`images.${index}.thumbnailId`]: thumbnailId }
          }
        }
      });
    });

    console.log(
      `  ${String(gallery.name).padEnd(16)} ${String(images.length).padStart(6)} ${String(gLinked).padStart(6)} ${String(gToLink).padStart(7)} ${String(gMissing).padStart(7)}`
    );
  }

  console.log('');
  console.log('Summary:');
  console.log(`  Galleries scanned          : ${galleries.length}`);
  console.log(`  Images scanned             : ${totalImages}`);
  console.log(`  Already linked (skipped)   : ${alreadyLinked}`);
  console.log(`  Would link / linked        : ${willLink}`);
  console.log(`  No thumbnail found         : ${noThumbnailFound}`);
  console.log('');

  if (willLink === 0 && alreadyLinked > 0) {
    console.log('Nothing to do — every image already has a thumbnailId.');
  }

  if (willLink === 0 && alreadyLinked === 0 && totalImages > 0) {
    console.log('WARNING: zero matches across every image.');
    console.log('Do NOT re-run with --apply to force it. Zero matches almost always means');
    console.log('an ObjectId comparison problem, not a genuinely empty result.');
  }

  // ---------------------------------------------------------------------
  // 3. Write, but only when explicitly asked.
  // ---------------------------------------------------------------------
  if (!APPLY) {
    console.log('DRY RUN — nothing was written.');
    console.log('Re-run with --apply once the numbers above look right.');
  } else if (operations.length > 0) {
    const result = await Gallery.collection.bulkWrite(operations, { ordered: false });
    console.log(`Wrote. matchedCount=${result.matchedCount} modifiedCount=${result.modifiedCount}`);

    if (result.modifiedCount !== willLink) {
      console.log('');
      console.log(`NOTE: expected to modify ${willLink} but modified ${result.modifiedCount}.`);
      console.log('Re-run the dry run to see the current state before doing anything else.');
    }
  } else {
    console.log('--apply given, but there was nothing to write.');
  }

  console.log('');
  await mongoose.connection.close();
  process.exit(0);
};

backfillThumbnails().catch(async (error) => {
  console.error('Backfill failed:', error);
  try {
    await mongoose.connection.close();
  } catch {
    // connection may never have opened
  }
  process.exit(1);
});
