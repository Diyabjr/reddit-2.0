import { Alert, AlertDescription, AlertIcon, AlertTitle, Flex, Icon, Text } from '@chakra-ui/react';
import React, { useRef, useState } from 'react';
import { BiPoll } from "react-icons/bi";
import {BsLink45Deg, BsMic } from 'react-icons/bs';
import { IoDocumentText, IoImageOutline } from "react-icons/io5";
import TabItem from './TabItem';
import TextInputs from '../Posts/PostForm/TextInputs';
import ImageUpload from './PostForm/ImageUpload';
import { User } from 'firebase/auth';
import { Post } from '../../atoms/postAtom';
import { useRouter } from 'next/router';
import { addDoc, collection, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { firestore, storage } from '../../firebase/clientApp';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import useSelectFile from '../../hooks/useSelectFile';

type NewPostFormProps = {
  user: User;
  communityImageURL?: string;
};


const formTabs: TabItem[] = [
      {
        title: "Post",
        icon: IoDocumentText,
      },
      {
        title: "Images & Video",
        icon: IoImageOutline,
      },
      {
        title: "Link",
        icon: BsLink45Deg,
      },
      {
        title: "Poll",
        icon: BiPoll,
      },
      {
        title: "Talk",
        icon: BsMic,
      },
];

export type TabItem = {
    title: string;
    icon: typeof Icon.arguments;
  };
  


const NewPostForm:React.FC<NewPostFormProps> = ({ 
  user,
  communityImageURL,
}) => {

    const {selectedFile, setSelectedFile,onSelectFile}= useSelectFile();
    const [selectedTab, setSelectedTab] = useState(formTabs[0].title);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const router = useRouter();
    const selectFileRef = useRef<HTMLInputElement>(null);
    const [textInputs, setTextInputs] = useState({
      title: "",
      body: "",
    });
    


    const handleCreatePost = async () => {

      setLoading(true);

      const {communityId} = router.query;
       
          const newPost: Post = {
              communityId: communityId as string,
              creatorId: user?.uid,
              communityImageURL: communityImageURL || "",
              creatorDisplayName: user.email!.split('@')[0],
              title: textInputs.title,
              body: textInputs.body,
              numberOfComments: 0,
              voteStatus: 0,
              createdAt: serverTimestamp() as Timestamp,
              editedAt: serverTimestamp() as Timestamp,
          };

          try{
            const postDocRef = await addDoc(collection(firestore, 'posts'), newPost);



            if(selectedFile){
              const imageRef = ref(storage, `posts/${postDocRef.id}/image`);
              await uploadString(imageRef, selectedFile, "data_url");
              const downloadURL = await getDownloadURL(imageRef);


              await updateDoc(postDocRef, {
                imageURL: downloadURL,
              });
            }
            router.back();
          }catch(error: any){
            console.log("handleCreatePost error", error.message)
            setError(true);
          }
          setLoading(true);

         
    };


    const onTextChange = ({
      target: { name, value },
    }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setTextInputs((prev) => ({
        ...prev,
        [name]: value,
      }));
    };
    
    return(
        <Flex direction="column" bg="white" borderRadius={4} mt={2}>
            <Flex width="100%">
                    {formTabs.map((item, index) => (
                        <TabItem 
                        key={index}
                        item={item} 
                        selected={item.title === selectedTab} setSelectedTab={setSelectedTab}
                        />
                    ))}
            </Flex>
            <Flex p={4}>
            {selectedTab === "Post" && (
              <TextInputs 
              textInputs={textInputs} 
              handleCreatePost={handleCreatePost} 
              onChange={onTextChange} 
              loading={loading}
              />
              )}
              {selectedTab === "Images & Video" && <ImageUpload 
               selectedFile={selectedFile}
               setSelectedFile={setSelectedFile}
               setSelectedTab={setSelectedTab}
               selectFileRef={selectFileRef}
               onSelectImage={onSelectFile}

              /> }
            </Flex>
            {error && (
              <Alert status='error'>
              <AlertIcon />
              <Text mr={2}>Error creating post</Text>
            </Alert>
            )}
        </Flex>
    )
}
export default NewPostForm;