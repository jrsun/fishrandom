#!/bin/bash

#
# Download images from a Wikimedia Commons category
#
# Highest preview resolution and metadata in XML format will be saved in subfolders.
# Usage: execute this script on a Linux command line, providing the full URL to the category page.
#
# Shell tools required for this script: wget sed grep
#

WIKI_URL=$1
if [ "$WIKI_URL" == '' ]; then
	echo "Please provide a link to the category page you wish to download"
	echo
	exit 1
fi

# Get the main (category) page provided
echo "Downloading Image Pages"
wget --adjust-extension -nv -r -l 1 -A '*File:*' -e robots=off -w 1 -nc $WIKI_URL

# We could skip the next step by regexping the thumb URLs, e.g.:
# from https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Adam_and_Eve_Amerbach_Cabinet_HMB_1870-942_c1362.jpg/94px-Adam_and_Eve_Amerbach_Cabinet_HMB_1870-942_c1362.jpg
# to.. https://upload.wikimedia.org/wikipedia/commons/6/6c/Adam_and_Eve_Amerbach_Cabinet_HMB_1870-942_c1362.jpg
echo "Extracting Image Links"
WIKI_LINKS=`grep fullImageLink commons.wikimedia.org/wiki/File\:* | sed 's/^.*a href="//'| sed 's/".*$//'`

echo "Downloading Images"
wget -nv -nc -w 1 -e robots=off -P downloaded_wiki_images $WIKI_LINKS

# Use the original service
#API_URL="https://tools.wmflabs.org/magnus-toolserver/commonsapi.php?meta&image="
# ...or use Oleg's patched version
API_URL="http://opendata.utou.ch/glam/magnus-toolserver/commonsapi.php?meta&image="
# ...or host your own by cloning https://bitbucket.org/magnusmanske/magnus-toolserver
#API_URL="http://localhost/glam/portraitdomain/magnus-toolserver/public_html/commonsapi.php?meta&image="

echo "Downloading Metadata"
mkdir -p downloaded_meta_data
cd downloaded_meta_data
for f in ../downloaded_wiki_images/*; do
	IMAGE_FILE=`echo $f | sed 's/\.\.\/downloaded_wiki_images\///'`
	# Clean out pixel size and convert spaces
	IMAGE_FILE=`echo $IMAGE_FILE | sed 's/ /_/g' | sed 's/.*px-//'`
	# Remove thumbnail extension from filename
	IMAGE_FILE=`echo $IMAGE_FILE | sed 's/\.\([a-z]\+\)\.jpg/\.\1/'`
	#echo $IMAGE_FILE
	# Fetch using the remote API service configured above
	wget -nv -nc -w 1 -e robots=off -O $IMAGE_FILE.xml $API_URL$IMAGE_FILE
done
cd ..

echo "Cleaning up image filenames"
cd downloaded_wiki_images
for i in *.jpg; do j=`echo $i | sed 's/.*[0-9]px-//g'`; mv "$i" "$j"; done
cd ..

echo "Cleaning up temp files"
rm -rf commons.wikimedia.org/

echo "Done"
exit
